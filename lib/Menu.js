const Action = require("./Action");
const inquirer = require("inquirer");

//Class to handle dealing with menus and sub-menus with Inquirer

class Menu{
    constructor(menuName, preamble, questionText, menuParent) {
        this.options = [];
        this.menuName = menuName;
        this.preamble = preamble;
        this.questionText = questionText,
        this.menuParent = menuParent? menuParent: null;
    }

    addAction(name, actionFn){
        this.options.push(new Action(name, actionFn, this));
    }

    display() {
        if(this.preamble) console.log(this.preamble);

        return inquirer.prompt({
            name:"result",
            type: "list",
            message: this.questionText,
            choices: this.makeInquirerChoices()

        }).then (({result})=> {
            if(result === null) return;
            if(result === -1) return this.menuParent.display();

            return this.options[result].execute();
        })
    }

    //Constructs inquirer choices from Action objects
    makeInquirerChoices() {

        const choices = this.options.map((opt, i) => opt.makeInquirerChoice(i));

        if(this.menuParent) choices.push({
            name: "Go back",
            value: -1
        });

        choices.push({
            name: "Exit",
            value: null
        });

        return choices;
    }
}

module.exports = Menu;