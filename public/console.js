jQuery(function($, undefined) {
    $('#console').terminal(function(command) {
        if (command !== '') {
            try {
                // var result = window.eval(command);
                var result = peg$parse(command);
                switch(result.op) {
                    case delLC: // 'delete lastClicked'
                        var tile = deleteTileHTML(lastClickedId);
                        reportTileDeletionToServer(tile);
                        break;
                    default:
                        // @TODO - If we get here there is a bug!  The parser should never pass an illegal 
                        //   command.  We devs must have screwed up.
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