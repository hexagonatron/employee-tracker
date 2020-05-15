class Action {
    constructor(name, actionFunction, parentMenu){
        this.name = name,
        this.actionFunction = actionFunction,
        this.parentMenu = parentMenu
    }

    //returns an inquirer choice
    makeInquirerChoice(value){
        return {
            name: this.name,
            value
        }
    }

    execute() {
        this.actionFunction()
    }
}

module.exports = Action;