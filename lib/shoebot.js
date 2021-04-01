'use babel';

const { exec } = require('child_process');
const remote = require('electron').remote
const fs = require('fs');
const path = require('path');
const ConsoleView = require('./console-view');
const config = require('./config');

export default {
  process: null,
  consoleview: null,
  config: config,

  activate() {
    atom.commands.add('atom-workspace', {
      'shoebot:run': () => { this.runSketch() },
      'shoebot:export': () => { this.exportSketch() },
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
    sbot = path.normalize(atom.config.get("shoebot.shoebot-executable"))
    command = sbot + ' --window ' + file.path
    console.log("Running command: " + command)

    if (this.process) { this.process.kill() }
    if (this.consoleView) { this.consoleView.clear() }

    errormsg = null
    this.process = exec(command, function(error, stdout, stderr) {
      if (error) {
        console.log(error.stack);
        console.log('Error code: '+error.code);
        console.log('Signal received: '+error.signal);
      }
    })
    this.process.on('exit', function (code) {
      console.log('Child process exited with exit code '+code);
      if (code) {
        atom.notifications.addError("Error running sketch!", { detail: errormsg })
        linenumber = parseInt(errormsg.split(":")[0].split(" line ")[1])
        editor.setCursorScreenPosition([linenumber-1, 0])
      }
    });
    this.process.stdout.on('data', (data) => { this.display(data) });
    this.process.stderr.on('data', (data) => {
      // look for Shoebot error message in stderr,
      // because sbot doesn't output an error code (issue #361)
      if (data.includes('Error in the Shoebot script at line')) {
        errormsg = data.split('Traceback')[0]
      } else {
        this.display(data)
      }
    })
  },

  exportSketch() {
    remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
      properties: [],
      filters: [
        { name: 'SVG Files', extensions: ['svg'] },
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'PNG Files', extensions: ['png'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    }).then(result => {
      if (result.filePath) {
        atom.notifications.addInfo("Exporting sketch...")
        editor = atom.workspace.getActivePaneItem()
        scriptPath = editor.buffer.file.path
        sbot = path.normalize(atom.config.get("shoebot.shoebot-executable"))
        command = sbot + ' ' + scriptPath + ' --outputfile ' + result.filePath

        exportErrormsg = null
        exportProcess = exec(command, function(error, stdout, stderr) {
          if (error) {
            console.log(error.stack);
            console.log('Error code: '+error.code);
            console.log('Signal received: '+error.signal);
          }
        })
        exportProcess.on('exit', function (code) {
          if (!code) {
            atom.notifications.addSuccess("Export finished!", {
              description: "The sketch was output to " + result.filePath,
            })
          } else {
            atom.notifications.addError("Error in export!", {
              detail: exportErrormsg,
            })
            linenumber = parseInt(exportErrormsg.split(":")[0].split(" line ")[1])
            editor.setCursorScreenPosition([linenumber-1, 0])
          }
        });
        exportProcess.stderr.on('data', (data) => {
          // look for Shoebot error message in stderr,
          // because sbot doesn't output an error code (issue #361)
          if (data.includes('Error in the Shoebot script at line')) {
            exportErrormsg = data.split('Traceback')[0]
          }
        });
      }
    })
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
