import { EditorState, StateField, StateEffect, RangeSetBuilder } from '@codemirror/state';
import { EditorView, basicSetup } from 'codemirror';
//import { cpp } from '@codemirror/lang-javascript';
import { gutter, GutterMarker } from '@codemirror/view';

const socket = io();
let applyingRemote = false;
let currentRevision = 0;

const addConflict = StateEffect.define();
const conflictField = StateField.define({
  create() { return []; },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(addConflict)) return [...value, effect.value];
    }
    return value;
  }
});

class ConflictMarker extends GutterMarker {
  toDOM() {
    const el = document.createElement('div');
    el.textContent = '🔴';
    el.style.cursor = 'pointer';
    return el;
  }
}

const view = new EditorView({
  state: EditorState.create({
    doc: '',
    extensions: [
      basicSetup,
     
      conflictField,
      gutter({
        class: 'conflict-gutter',
        markers(view) {
          const conflicts = view.state.field(conflictField);
          const builder = new RangeSetBuilder();
          const sorted = [...conflicts].sort((a, b) => a - b);
          for (const lineNum of sorted) {
            try {
              const line = view.state.doc.line(lineNum);
              builder.add(line.from, line.from, new ConflictMarker());
            } catch (e) {}
          }
          return builder.finish();
        }
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !applyingRemote) {
          update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
            let op;
            if (inserted.length > 0 && fromA === toA) {
              op = { type: 'insert', pos: fromA, text: inserted.toString(), baseRevision: currentRevision };
            } else if (inserted.length === 0) {
              op = { type: 'delete', pos: fromA, len: toA - fromA, baseRevision: currentRevision };
            } else {
              socket.emit('op', { type: 'delete', pos: fromA, len: toA - fromA, baseRevision: currentRevision });
              op = { type: 'insert', pos: fromA, text: inserted.toString(), baseRevision: currentRevision };
            }
            socket.emit('op', op);
          });
        }
      })
    ]
  }),
  parent: document.getElementById('editor')
});

socket.on('joined', ({ doc, revision }) => {
  currentRevision = revision;
  applyingRemote = true;
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: doc } });
  applyingRemote = false;
});

socket.on('ack', ({ revision }) => {
  currentRevision = revision;
});

socket.on('op', (op) => {
  currentRevision = op.revision;
  applyingRemote = true;
  const docLen = view.state.doc.length;
  if (op.type === 'insert') {
    const pos = Math.min(op.pos, docLen);
    view.dispatch({ changes: { from: pos, to: pos, insert: op.text } });
  } else if (op.type === 'delete') {
    const from = Math.min(op.pos, docLen);
    const to = Math.min(op.pos + op.len, docLen);
    view.dispatch({ changes: { from, to, insert: '' } });
  }
  if (op.concurrent) {
    view.dispatch({ effects: addConflict.of(op.conflictLine) });
  }
  applyingRemote = false;
});