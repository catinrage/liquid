export namespace entropy.lang.ast {
  export class Program {
    constructor(public machines: Machine[]) {}
  }

  export class Machine {
    constructor(public name: string, public body: MachineBody) {}
  }

  export class MachineBody {
    constructor(public states: (State | Routine)[]) {}
  }

  export class State {
    constructor(public name: string, public initial: boolean, public body: StateBody) {}
  }

  export class StateBody {
    constructor(public events: Event[]) {}
  }

  export class Event {
    constructor(public name: string, public body: EventBody) {}
  }

  export class EventBody {
    constructor(public actions: Action[]) {}
  }

  export class Action {
    constructor(public type: 'goto' | 'pass', public target?: string) {}
  }

  export class Routine {
    constructor(public name: string, public body: RoutineBody) {}
  }

  export class RoutineBody {
    constructor(public actions: Action[]) {}
  }
}
