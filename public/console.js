jQuery(function($, undefined) {
    $('#console').terminal(function(command) {
        if (command !== '') {
            try {
                // var result = window.eval(command);
                var result = peg$parse(command);
                if (result !== undefined) {
                    this.echo(new String(result));
                }
            } catch(e) {
                this.error(new String(e));
            }
        } else {
           this.echo('');
        }
    }, {
        // greetings: 'Javascript Interpreter',
        greetings: 'Console:',
        name: 'type commands here:',
        prompt: 'cnsl> ',
        scrollOnEcho: true
    });
});