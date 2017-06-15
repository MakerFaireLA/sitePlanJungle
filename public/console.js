jQuery(function($, undefined) {
    $('#console').terminal(function(command) {
        if (command !== '') {
            try {
                // var result = window.eval(command);
                var result = peg$parse(command);
                // this.echo(result.op);
                switch(result.op) {
                    case 'delLC': // 'delete lastClicked'
                        var tile = deleteTileHTML(lastClickedId);
                        reportTileDeletionToServer(tile);
                        break;
                    case 'dupLCInc': // 'duplicate lastClicked and increment'
                        // start by duplicating the state of the last clicked tile
                        var tile = extractTileDataFromHTML(lastClickedId); 
                        // since this is a new tile, assign it a fresh tile_id
                        var newTileId = max_tile_id + 1;
                        tile.tile_id = newTileId;
                        // And assign it a fresh userRef field.
                        // @TODO - At some point we'll have to remove the assumption about the userRefPrefix
                        //   that I'm using here, and instead pull this data from the lastClicked tile struct.
                        var userRefNewVal = findHighestValueUserRef('Ex-') + 1;
                        var extracts = tile.userRef.split('-');
                        tile.userRef = extracts[0] + '-' + userRefNewVal;
                        tile.color = 'orange';
                        // @TODO - going to have to fix the whole color problem.
                        // offset the tile from lastClicked
                        tile.location.x += Math.round(tile.dimensions.x*1.5);
                        tile.location.y += Math.round(tile.dimensions.y*1.5);
                        renderTile(tile);
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