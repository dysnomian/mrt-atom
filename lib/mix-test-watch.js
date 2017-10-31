'use babel';

import { CompositeDisposable, BufferedProcess } from 'atom';
import {
  LineMessageView,
  MessagePanelView,
  PlainMessageView
} from 'atom-message-panel';

export default {
  subscriptions: null,
  messages: null,
  watcher: null,
  running: false,
  markers: [],

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view and command to clear markers on save
    const _this = this;
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mix-test-watch:toggle': () => this.toggle(),
      'core:save': () => {
        _this.markers.forEach(marker => marker.destroy());
        _this.messages.clear()
      }
    }));

    // Prepare message panel
    this.messages = new MessagePanelView({
      title: "<span style='font-size: medium;' >`mix test.watch`</span>",
      rawTitle: true}
    )
    this.messages.attach()

    // Show activation message
    atom.notifications.addInfo('Starting `mix test.watch`');
  },

  deactivate() {
    this.subscriptions.dispose();
    this.stopMix();
  },

  stopMix() {
    this.watcher.kill();
    this.messages.close();
    this.watcher = null;
    this.running = false;
    atom.notifications.addInfo('Stopped `mix test.watch`')
  },

  parseError(error) {
    const errorMatcher = /\((\w*)Error\).*(\s\S*.ex?s):(\d)/;
    result = errorMatcher.exec(error)
    if (result != null) {
      const [wholeMatch, errorType, errorFile, errorLine] = result;
      return {wholeMatch, errorType, errorFile, errorLine};
    };
    return null
  },

  toggle() {
    if (this.running === false) {
      this.watcher = new BufferedProcess({
        command: 'mix',
        args: ['test.watch'],
        options: {
          stdio: "pipe",
          env: Object.assign({}, process.env, { 'MIX_ENV': 'test' }),
          cwd: atom.project.getPaths()[0],
          shell: true
        },
        stdout: (str) => {
          var message = str.replace(/iex\(1\)>/g, '\n').split('\n');
          message = message.filter(m => m !== ' .' && m !== '').join('\n');

          if (message.includes('failed')) {
            this.parseError(message);

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
          } else if (message.includes('stacktrace') || message.includes('Error')) {
            // Add message panel entry
            this.parseError(message);
            this.messages.attach()
            this.messages.add(new LineMessageView({
              message: 'Error',
              preview: message
             }));
          } else if (message.includes('Quote of the day')) {
            this.running = true;
            atom.notifications.addSuccess('Successfully started `mix test.watch`');
          }
        },
        stderr: function(message) {console.log('out', message); }
      })
    } else {
      this.stopMix();
      this.markers.forEach(marker => marker.destroy())
    }
  }
};
