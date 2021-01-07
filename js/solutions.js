function h(p,s,e) { if (p===1) { sm(s,e); } else { let o = 6-(s+e); h(p-1, s,o); sm(s,e); h(p-1, o,e); } }
function sm(_s, _e) { vars.game.solution.push([_s,_e]); }