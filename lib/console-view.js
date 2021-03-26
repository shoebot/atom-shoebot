'use babel';

export default class ConsoleView {

  shoebotConsole = null;
  log = null;

  constructor(status) {
    this.status = status
  }

  initUI() {
    if (this.shoebotConsole) return;

    this.shoebotConsole = document.createElement('div');
    this.shoebotConsole.setAttribute('tabindex', -1);
    this.shoebotConsole.classList.add('shoebot', 'console', 'native-key-bindings');
    this.shoebotConsole.setAttribute('style', 'overflow-y: scroll;')

    this.log = document.createElement('div');
    this.shoebotConsole.appendChild(this.log);

    atom.workspace.open({
      element: this.shoebotConsole,
      getTitle: () => 'Shoebot',
      getURI: () => 'atom://shoebot/console-view',
      getDefaultLocation: () => 'bottom'
    }, { activatePane: false });

    atom.workspace.getBottomDock().show()
  }

  prompt() {
    /*
    return atom.config.get('shoebot.consolePrompt')
      .replace("%ec", this.status.evalCount())
      .replace("%ts", this.status.timestamp())
      .replace("%diff", this.status.diff())
      + "> "
    */
    return "> "
  }

  logPromptOut(text) {
    this.logStdout(this.prompt() + text);
  }

  logPromptErr(text) {
    this.logStderr(this.prompt() + text);
  }

  logStdout(text) {
    this.logText(text);
  }

  logStderr(text) {
    this.logText(text, true);

    /*
    if (atom.config.get('shoebot.showErrorNotifications')) {
      atom.notifications.addError(text)
    }
    */
  }

  logText(text, error) {
    if (!text) return;
    var pre = document.createElement("pre");
    if (error) {
      pre.className = "error";
    }

    /*
    if (atom.config.get('shoebot.onlyLogLastMessage')) {
      this.log.innerHTML = "";
    }
    */
    pre.innerHTML = text;
    this.log.appendChild(pre);

    /*
    if (!error && atom.config.get('shoebot.onlyShowLogWhenErrors')) {
      this.shoebotConsole.classList.add('hidden');
    } else {
      this.shoebotConsole.classList.remove('hidden');
    }
    */
    this.shoebotConsole.classList.remove('hidden');

    this.shoebotConsole.scrollTop = this.shoebotConsole.scrollHeight;
  }

  clear() {
    this.log.innerHTML = " "  
  }

  // it's needed for package serialization
  serialize() { }

  destroy() {
    this.shoebotConsole.remove();
  }
}

const mark = (string) =>`<mark>${string}</mark>`
