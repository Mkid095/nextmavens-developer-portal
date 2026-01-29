import {Command} from '@oclif/core';

export default class HelloCommand extends Command {
  static description = 'Say hello to the world';

  async run(): Promise<void> {
    this.log('Hello from NextMavens CLI!');
  }
}
