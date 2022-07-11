/*jshint esversion: 6 */
const express = require('express');
const path = require('path');
const fs = require('fs');

// We want to find the directory in which the server is called
const cwd = process.cwd();
const port = 3000;

const pdf_path = process.argv[2];

const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);

var current_pdf = path.join('cwd', pdf_path);

// https://github.com/nodejs/node/issues/5039
var fsBuffer;
function watchFile(filepath, callback) {
    var fpath = path.resolve(filepath),
        fdir = path.dirname(fpath),
        fname = path.basename(fpath);
        fs.statSync(fdir);
    return fs.watch(fdir, {persistent: false, recursive: false}, function (event, changed_fname) {
        if (changed_fname === fname) {
            fs.stat(fpath, function (err) {
                if (fsBuffer) {
                    clearTimeout(fsBuffer);
                }
                fsBuffer = setTimeout( () => {
                    callback && callback(null, !err, fpath);
                    fsBuffer = null;
                }, 500);
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

/** Grab anything that has /pdf/ */
app.get('/pdf', (req,res) => {
    res.redirect(`/node/viewer?file=${current_pdf}`);
});

app.get('/pdf/:pdf_file',(req,res) => {
    res.redirect(`/node/viewer?file=${path.join('/node',req.params.pdf_file)}`);
});

io.on('connection',(socket) => {
    console.log('a user connected!');
    socket.on('initialize',(data) => {
        if (pdf_path) {
            try {
                watchFile(pdf_path, () => {
                    console.log('Sending reload notice through sockets');
                    socket.emit('reload', {
                        current_pdf: current_pdf
                    });
                });
            }
            catch (e) {
                console.error(e)
            }
        } else {
            console.log('pdf_file not found');
        }
    });
});

http.listen(port, () => {
    console.log(`Express App listening on port ${port}! Serving file ${current_pdf}.`);
});
