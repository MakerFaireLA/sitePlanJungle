
start
    = dupLCInc / delLC

delLC "'del lastClicked'" 
    = "del" space "lastClicked" { return {'op':'dellc'} }

dupLCInc "'dup lastClicked inc'" 
    = "dup" space "lastClicked" space "inc" { return {'op':'duplci'} }

space 
    = " "

int "integer" 
    = [0-9]+ { return parseInt(text(), 10); }