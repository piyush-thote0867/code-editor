const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let state = { doc: '', revision: 0, history: [] };

function apply(doc, op) {
  if (op.type === 'insert') return doc.slice(0, op.pos) + op.text + doc.slice(op.pos);
  if (op.type === 'delete') return doc.slice(0, op.pos) + doc.slice(op.pos + op.len);
  return doc;
}

function transform(opA, opB) {
  let b = { ...opB };
  if (opA.type === 'insert' && opB.type === 'insert') {
    if (opA.pos <= b.pos) b.pos += opA.text.length;
  } else if (opA.type === 'insert' && opB.type === 'delete') {
    if (opA.pos <= b.pos) b.pos += opA.text.length;
  } else if (opA.type === 'delete' && opB.type === 'insert') {
    if (opA.pos < b.pos) b.pos -= opA.len;
  } else if (opA.type === 'delete' && opB.type === 'delete') {
    if (opA.pos < b.pos) b.pos -= opA.len;
  }
  return b;
}

function posToLine(doc, pos) {
  return doc.slice(0, pos).split('\n').length;
}

io.on('connection', (socket) => {
  console.log('connected:', socket.id);
  socket.emit('joined', { doc: state.doc, revision: state.revision });

  socket.on('op', (op) => {
    console.log('received op:', op);
    let transformed = { ...op };
    const missed = state.history.filter(h => h.revision > op.baseRevision);
    for (const h of missed) transformed = transform(h.op, transformed);
    transformed.concurrent = missed.length > 0;
    transformed.conflictLine = posToLine(state.doc, transformed.pos);
    state.doc = apply(state.doc, transformed);
    state.revision++;
    transformed.revision = state.revision;
    state.history.push({ op: transformed, revision: state.revision });
    socket.emit('ack', { revision: state.revision });
    socket.broadcast.emit('op', transformed);
    console.log('doc now:', state.doc, '| revision:', state.revision);
  });

  socket.on('disconnect', () => console.log('disconnected:', socket.id));
});

server.listen(3000, () => console.log('running on http://localhost:3000'));