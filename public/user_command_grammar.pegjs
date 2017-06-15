del "del" = "del" space id:int { return {'op':'d', 'tile':{'tile_id':id}} }
space = " "
int "integer" = [0-9]+ { return parseInt(text(), 10); }