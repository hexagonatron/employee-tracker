class Action {
    constructor(name, returnToMenu, actionFunction, parentMenu){
        this.name = name,
        this.returnToMenuAfterExecution = returnToMenu,
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

    async execute() {
        await this.actionFunction();
        if(this.returnToMenuAfterExecution) return this.parentMenu.display();
    }
}

module.exports = Action;