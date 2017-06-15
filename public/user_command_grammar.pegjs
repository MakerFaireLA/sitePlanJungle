
start
    = dupLCInc / delLC

delLC "'del lastClicked'" 
    = "del" space "lastClicked" { return {'op':'delLC'} }

dupLCInc "'dup lastClicked inc'" 
    = "dup" space "lastClicked" space "inc" { return {'op':'dupLCInc'} }

space 
    = " "

int "integer" 
    = [0-9]+ { return parseInt(text(), 10); }