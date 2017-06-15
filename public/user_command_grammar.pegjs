
start
    = dupInc / delLC

delLC "'del lastClicked'" 
    = "del" space "lastClicked" { return {'op':'delLC'} }

dupInc "'dup increment'" 
    = "dup" space "increment" { return {'op':'dupInc'} }

space 
    = " "

int "integer" 
    = [0-9]+ { return parseInt(text(), 10); }