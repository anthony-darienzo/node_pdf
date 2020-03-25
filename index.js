/*jshint esversion: 6 */
const express = require('express');
const path = require('path');
const fs = require('fs');

// We want to find the directory in which the server is called
const cwd = process.cwd();
const port = 3000;
var current_pdf = '';

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// https://github.com/nodejs/node/issues/5039
function watchFile(filepath, callback) {
    var fpath = path.resolve(filepath),
        fdir = path.dirname(fpath),
        fname = path.basename(fpath);
    fs.statSync(fdir);
    return fs.watch(fdir, {persistent: false, recursive: false}, function (event, changed_fname) {
        if (changed_fname === fname) {
            fs.stat(fpath, function (err) {
                callback && callback(null, !err, fpath);
            });
        }
    });
}

app.use('/pdfjs-2',express.static(path.join(__dirname,'resources','pdfjs-2')));
app.use('/cwd', express.static(cwd));

app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname,'resources','index.html'));
});

app.get('/viewer', (req,res) => {
    res.sendFile(path.join(__dirname,'resources','viewer2.html'));
});

/** Set the name of the pdf file to be tracked */
app.get('/update/:filename', (req,res) => {
    current_pdf = path.join(path.join('/iridium','node','cwd',req.params.filename));
    res.json({
        'current_pdf': current_pdf
    });
});

/** Grab anything that has /pdf/ */
app.get('/pdf', (req,res) => {
    // This program is running on iridium, so we must pass the correct URI
    res.redirect(`/iridium/node/viewer?file=${current_pdf}`);
});
app.get('/pdf/:pdf_file',(req,res) => {
    res.redirect(`/iridium/node/viewer?file=${path.join('/iridium','node',req.params.pdf_file)}`);
});

io.on('connection',(socket) => {
    console.log('a user connected!');
    socket.on('initialize',(data) => {
        if (data.hasOwnProperty('pdf_file')) {
            var pdf_path = data.pdf_file ? data.pdf_file : '';
            if (pdf_path.startsWith('/cwd'))
                pdf_path = path.join(cwd,path.basename(data.pdf_file)); // Replace alias with cwd
            watchFile(pdf_path, () => {
                socket.emit('reload',{});
            });
        } else {
            console.log('pdf_file not found');
        }
    });
});

http.listen(port, () => {
    console.log(`Express App listening on port ${port}!`);
});
