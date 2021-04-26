'use babel';

const { exec, spawn } = require('child_process');
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
      'shoebot:exportvideo': () => { this.exportVideo() },
      'shoebot:close': () => { this.closeSketch() },
    })
    this.consoleView = new ConsoleView()
    this.consoleView.initUI()
    this.sbotDir = path.normalize(atom.config.get("shoebot.shoebot-dir"))
    this.sbot = path.join(this.sbotDir, 'bin/sbot')
    this.sbotvideo = path.join(this.sbotDir, 'bin/sbot-video-export')
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

  runSketch() {
    this.saveSketch()
    editor = atom.workspace.getActivePaneItem()
    scriptFile = editor.buffer.file
    scriptDir = path.dirname(scriptFile.path)
    command = this.sbot + ' --window ' + scriptFile.path
    console.log("Running command: " + command)

    if (this.process) {
      // killing shell processes is not trivial
      // https://github.com/nodejs/node/issues/2098#issuecomment-169469019
      spawn("sh", ["-c", "kill -INT -" + this.process.pid])
    }
    if (this.consoleView) { this.consoleView.clear() }

    errormsg = null
    /* runSketch uses spawn instead of exec because it was the only
       way to be able to kill the child processes. I might have
       overlooked a way to accomplish this with exec() but I'm
       tired and the feature is fixed
    */
    this.process = spawn(command, {shell: true, detached: true, cwd: scriptDir})
    this.process.on('exit', function (code) {
      console.log('Child process exited with exit code '+code);
      if (errormsg) {
        atom.notifications.addError("Error running sketch!", { detail: errormsg })
        linenumber = parseInt(errormsg.split(":")[0].split(" line ")[1])
        editor.setCursorScreenPosition([linenumber-1, 0])
      }
    })
    this.process.stdout.on('data', (data) => {
        var content = data.toString()
        this.display(content)
    })
    this.process.stderr.on('data', (data) => {
        var content = data.toString()
        if (content.includes('Error in the Shoebot script at line') && !content.includes('KeyboardInterrupt')) {
          errormsg = content.split('Traceback')[0]
        } else {
          this.display(content)
        }
    })
    this.process.on('error', (err) => {
      console.log("Error on runSketch spawn:")
      console.log(err)
    })
  },

  exportSketch() {
    this.saveSketch()
    editor = atom.workspace.getActivePaneItem()
    scriptFile = editor.buffer.file
    scriptDir = path.dirname(scriptFile.path)
    remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
      properties: [],
      defaultPath: scriptFile.path.replace(/.bot$/, '.svg'),
      filters: [
        { name: 'SVG Files', extensions: ['svg'] },
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'PNG Files', extensions: ['png'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    }).then(result => {
      if (result.filePath) {
        atom.notifications.addInfo("Exporting sketch...")
        command = this.sbot + ' ' + scriptFile.path + ' --outputfile ' + result.filePath

        exportErrormsg = null
        exportProcess = exec(command, {cwd: scriptDir}, (error, stdout, stderr) => {
          if (error) {
            console.log(error.stack);
            console.log('Error code: '+error.code);
            console.log('Signal received: '+error.signal);
          }
        })
        exportProcess.on('exit', function (code) {
          if (!exportErrormsg) {
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
          if (data.includes('Error in the Shoebot script at line') && !data.includes('KeyboardInterrupt')) {
            exportErrormsg = data.split('Traceback')[0]
          }
        });
      }
    })
  },

  exportVideo() {
    this.saveSketch()
    editor = atom.workspace.getActivePaneItem()
    scriptFile = editor.buffer.file
    scriptDir = path.dirname(scriptFile.path)
    remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
      properties: [],
      defaultPath: scriptFile.path.replace(/.bot$/, '.mp4'),
      filters: [
        { name: 'MP4 Files', extensions: ['mp4'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    }).then(result => {
      if (result.filePath) {
        atom.notifications.addInfo("Exporting sketch...")
        command = ". " + this.sbotDir + "bin/activate && "
        command += this.sbotvideo + ' ' + scriptFile.path + ' --outputfile ' + result.filePath
        console.log(command)

        exportErrormsg = null
        exportProcess = spawn(command, {shell: true, detached: true, cwd: scriptDir}, (error, stdout, stderr) => {
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
            console.log(code)
          } else {
            atom.notifications.addError("Error in export!", {
              detail: exportErrormsg,
            })
            linenumber = parseInt(exportErrormsg.split(":")[0].split(" line ")[1])
            editor.setCursorScreenPosition([linenumber-1, 0])
          }
        });
        exportProcess.stderr.on('data', (data) => {
          var content = data.toString()
          if (content.includes('Error in the Shoebot script at line') && !content.includes('KeyboardInterrupt')) {
            exportErrormsg = content.split('Traceback')[0]
          }
          console.log(content)
        });
      }
    })




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
