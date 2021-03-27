'use babel';

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const psTree = require('ps-tree');
const ConsoleView = require('./console-view');
const config = require('./config');

export default {
  process: null,
  consoleview: null,
  config: config,

  activate() {
    atom.commands.add('atom-workspace', {
      'shoebot:run': () => { this.runSketch() },
      'shoebot:close': () => { this.closeSketch() },
    })
    this.consoleView = new ConsoleView()
    this.consoleView.initUI()
  },

  deactivate() {
    this.consoleView.destroy()
  },

  saveSketch() {
    editor = atom.workspace.getActivePaneItem()
    file = editor.buffer.file
    if (file.existsSync()) {
      editor.save()
    } else {
      num = Math.floor(Math.random() * 10000)
      dir = fs.mkdirSync("/tmp/sketch_#{num}/")
      editor.saveAs("/tmp/sketch_#{num}/sketch_#{num}.bot")
    }
  },

  buildSketch() {
    editor = atom.workspace.getActivePaneItem()
    file = editor.buffer.file
    folder = file.getParent().getPath()
    build_dir = path.join(folder, "build")
    sbot = path.normalize(atom.config.get("shoebot.shoebot-executable"))
    command = sbot + ' --window ' + file.path
    console.log("Running command" + command)

    stdout = (output) => this.display(output)
    stderr = (output) => this.display(output)
    exit = (code) => console.log("Error code: " + code)

    if (this.process) {
      this.process.kill()
    }
    if (this.consoleView) {
      this.consoleView.clear()
    }
    this.process = exec(command, function(error, stdout, stderr) {
      if (error) {
        console.log(error.stack);
        console.log('Error code: '+error.code);
        console.log('Signal received: '+error.signal);
      }
    })
    this.process.on('exit', function (code) {
      console.log('Child process exited with exit code '+code);
    });
    this.process.stdout.on('data', (data) => { this.display(data) });
    this.process.stderr.on('data', (data) => { this.display(data) });
  },

  runSketch() {
    this.saveSketch()
    this.buildSketch()
  },

  display(line) {
    this.consoleView.logText(line)
  },

  closeSketch() {
    this.consoleView.clear()
    if (this.process) {
      this.process.kill()
    }
  },
}
