'use babel';

import { CompositeDisposable, BufferedProcess } from 'atom';
import { LineMessageView, MessagePanelView } from 'atom-message-panel';

export default {
  subscriptions: null,
  messages: null,
  watcher: null,
  markers: [],

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view and command to clear markers on save
    const _this = this;
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mrt-atom:toggle': () => this.toggle(),
      'core:save': () => {
        _this.markers.forEach(marker => marker.destroy());
        _this.messages.clear()
      }
    }));

    // Prepare message panel
    this.messages = new MessagePanelView({
      title: "<span style='font-size: medium;' >Elixir test watcher</span>",
      rawTitle: true}
    )
    this.messages.attach()

    // Show activation message
    atom.notifications.addSuccess('Started Elixir test watcher.');
  },

  deactivate() {
    this.subscriptions.dispose();
    this.stopIex();
  },

  stopIex() {
    this.watcher.kill();
    this.messages.close();
    this.watcher = null;
    atom.notifications.addInfo('Stopped Elixir test watcher.')
  },

  toggle() {
    if (this.watcher === null) {
      this.watcher = new BufferedProcess({
        command: 'iex',
        args: ['-S mix run', '-e', 'MrT.start'],
        options: {
          stdio: "pipe",
          env: Object.assign({}, process.env, { 'MIX_ENV': 'test' }),
          cwd: atom.project.getPaths()[0],
          shell: true
        },
        stdout: (str) => {
          console.log(str)
          var message = str.replace('.iex(1)>', '').replace('iex(1)>', '')

          if (message.includes('failed')) {
            // Get correct editor for file
            const fileName = /(\w*\.exs|ex\:)/.exec(message);
            const editor = atom.workspace.getTextEditors().find((editor) => {
              return editor.getFileName() === fileName[1];
            });

            if (editor) {
              // Extract failed test beginning and store current cursor temporarily
              failedLineNumber = /exs:(\d*)/.exec(message);
              const tmpCursorPosition = editor.getCursorBufferPosition();

              // Highlight failed paragraph
              editor.setCursorBufferPosition([parseInt(failedLineNumber[1]), 0]);
              const marker = editor.markBufferRange(editor.getCurrentParagraphBufferRange());
              this.markers.push(marker);
              editor.decorateMarker(marker, {type: 'line', class: 'failed'});

              // Reset cursor position
              editor.setCursorBufferPosition(tmpCursorPosition);

              // Add message panel entry
              console.log(this);
              this.messages.attach()
              this.messages.add(new LineMessageView({
                message: 'Test failed',
                preview: message,
                line: failedLineNumber[1],
                file: fileName[1] }
              ))
            }

          } else if (message.includes('0 failures')) {
            atom.notifications.addSuccess(message);
            this.messages.close()
          } else if (message.includes('stacktrace')) {
            atom.notifications.addError(message);
          }
        },
        stderr: function(message) {console.log('out', message); }
      })
    } else {
      this.stopIex();
      this.markers.forEach(marker => marker.destroy())
    }
  }
};
