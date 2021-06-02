'use babel';

export default {
  'shoebot-dir': {
      type:"string",
      default:"/usr/local/",
      description: `Path where Shoebot was installed. If you installed Shoebot system-wide, this should be "/usr/local/". If you installed it with virtualenvwrapper, it's "~/virtualenvs/shoebot".`,
  },
}
