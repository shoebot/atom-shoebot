{CompositeDisposable, BufferedProcess} = require 'atom'
fs = require 'fs'
path = require 'path'
psTree = require 'ps-tree'
ShoebotView = require './shoebot-view'

module.exports = Shoebot =
  config:
    'shoebot-executable':
      type:"string",
      default:"/home/rlafuente/.virtualenvs/shoebot/bin/sbot"

  activate: (state) ->
    atom.commands.add 'atom-workspace', 'shoebot:run': =>
      @runSketch()
    atom.commands.add 'atom-workspace', 'shoebot:present': =>
      @runSketchPresent()
    atom.commands.add 'atom-workspace', 'shoebot:close': =>
      @closeSketch()

  saveSketch: ->
    editor = atom.workspace.getActivePaneItem()
    file = editor?.buffer.file

    if file?.existsSync()
      editor.save()
    else
      num = Math.floor(Math.random() * 10000)
      dir = fs.mkdirSync("/tmp/sketch_#{num}/")
      editor.saveAs("/tmp/sketch_#{num}/sketch_#{num}.bot")

  buildSketch: ->
    console.log("build and run time")
    editor  = atom.workspace.getActivePaneItem()
    file    = editor?.buffer.file
    folder  = file.getParent().getPath()
    build_dir = path.join(folder, "build")
    command = path.normalize(atom.config.get("shoebot.shoebot-executable"))
    # args = ["-l", "--window", file]
    args = ["--window", file.path]
    options = {}
    console.log("Running command #{command} #{args.join(" ")}")
    stdout = (output) => @display output
    stderr = (output) => @display output
    exit = (code) ->
      console.log("Error code: #{code}")
    if !@view
      @view = new ShoebotView
      atom.workspace.addBottomPanel(item: @view)
    if @process
      psTree @process.process.pid, (err, children) =>
        for child in children
          process.kill(child.PID)
      @view.clear()
    @process = new BufferedProcess({command, args, stdout, stderr, exit})


  runSketch: ->
    @saveSketch()
    @buildSketch()

  display: (line) ->
    @view.log(line)

  closeSketch: ->
    if @view
      @view.clear()
    if @process
      psTree @process.process.pid, (err, children) =>
        for child in children
          process.kill(child.PID)
