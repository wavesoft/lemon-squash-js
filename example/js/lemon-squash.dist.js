!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.InteractiveSession=e():t.InteractiveSession=e()}(window,function(){return function(t){var e={};function r(s){if(e[s])return e[s].exports;var i=e[s]={i:s,l:!1,exports:{}};return t[s].call(i.exports,i,i.exports,r),i.l=!0,i.exports}return r.m=t,r.c=e,r.d=function(t,e,s){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:s})},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r.t=function(t,e){if(1&e&&(t=r(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var s=Object.create(null);if(r.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var i in t)r.d(s,i,function(e){return t[e]}.bind(null,i));return s},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=1)}([function(t,e,r){var s=void 0!==typeof JSON?JSON:r(2),i=r(5),n=r(6),o=r(7);e.quote=function(t){return i(t,function(t){return t&&"object"==typeof t?t.op.replace(/(.)/g,"\\$1"):/["\s]/.test(t)&&!/'/.test(t)?"'"+t.replace(/(['\\])/g,"\\$1")+"'":/["'\s]/.test(t)?'"'+t.replace(/(["\\$`!])/g,"\\$1")+'"':String(t).replace(/([#!"$&'()*,:;<=>?@\[\\\]^`{|}])/g,"\\$1")}).join(" ")};for(var h="(?:"+["\\|\\|","\\&\\&",";;","\\|\\&","[&;()|<>]"].join("|")+")",a="(\\\\['\"|&;()<> \\t]|[^\\s'\"|&;()<> \\t])+",u='"((\\\\"|[^"])*?)"',c="'((\\\\'|[^'])*?)'",l="",p=0;p<4;p++)l+=(Math.pow(16,8)*Math.random()).toString(16);e.parse=function(t,e,r){var p=function(t,e,r){var o=new RegExp(["("+h+")","("+a+"|"+u+"|"+c+")*"].join("|"),"g"),p=n(t.match(o),Boolean),f=!1;if(!p)return[];e||(e={});r||(r={});return i(p,function(t,i){if(!f){if(RegExp("^"+h+"$").test(t))return{op:t};for(var n=r.escape||"\\",o=!1,a=!1,u="",c=!1,d=0,m=t.length;d<m;d++){var _=t.charAt(d);if(c=c||!o&&("*"===_||"?"===_),a)u+=_,a=!1;else if(o)_===o?o=!1:"'"==o?u+=_:_===n?(d+=1,_=t.charAt(d),u+='"'===_||_===n||"$"===_?_:n+_):u+="$"===_?g():_;else if('"'===_||"'"===_)o=_;else{if(RegExp("^"+h+"$").test(_))return{op:t};if(RegExp("^#$").test(_))return f=!0,u.length?[u,{comment:t.slice(d+1)+p.slice(i+1).join(" ")}]:[{comment:t.slice(d+1)+p.slice(i+1).join(" ")}];_===n?a=!0:u+="$"===_?g():_}}return c?{op:"glob",pattern:u}:u}function g(){var r,i;if(d+=1,"{"===t.charAt(d)){if(d+=1,"}"===t.charAt(d))throw new Error("Bad substitution: "+t.substr(d-2,3));if((r=t.indexOf("}",d))<0)throw new Error("Bad substitution: "+t.substr(d));i=t.substr(d,r-d),d=r}else/[*@#?$!_\-]/.test(t.charAt(d))?(i=t.charAt(d),d+=1):(r=t.substr(d).match(/[^\w\d_]/))?(i=t.substr(d,r.index),d+=r.index-1):(i=t.substr(d),d=t.length);return function(t,r,i){var n="function"==typeof e?e(i):e[i];void 0===n&&(n="");return"object"==typeof n?r+l+s.stringify(n)+l:r+n}(0,"",i)}}).reduce(function(t,e){return void 0===e?t:t.concat(e)},[])}(t,e,r);return"function"!=typeof e?p:o(p,function(t,e){if("object"==typeof e)return t.concat(e);var r=e.split(RegExp("("+l+".*?"+l+")","g"));return 1===r.length?t.concat(r[0]):t.concat(i(n(r,Boolean),function(t){return RegExp("^"+l).test(t)?s.parse(t.split(l)[1]):t}))},[])}},function(t,e,r){const s=r(8).default;t.exports=class{constructor(t){this.localEmulator=new s(t),this.term=t,this.ws=null,this.mode="busy",this.resizeTimer=0,this.localEmulator.addAutocompleteHandler(()=>{const t=[];for(let e=0;e<101;e++)t.push("bash");return t}),this._handleTermData=this._handleTermData.bind(this),this._handleSessionData=this._handleSessionData.bind(this),this._handleResize=this._handleResize.bind(this),t.on("data",this._handleTermData.bind(this)),window.addEventListener("resize",this._handleResize)}connect(t){this.ws=new WebSocket(t),this._showInfo("starting session..."),this.ws.addEventListener("message",t=>{const e=JSON.parse(t.data);console.log("incoming: ",e),this._handleSessionData(e)}),this.ws.addEventListener("open",t=>{console.log("connected"),this._handleResize()}),this.ws.addEventListener("close",t=>{this._setMode("disabled")})}_setMode(t){switch(this.mode=t,console.log("mode=",t),t){case"busy":this.localEmulator.abortRead();break;case"idle":this._promptForInput();break;case"disabled":this.localEmulator.abortRead(),this._showError("session terminated");break;case"interactive":this.localEmulator.abortRead()}}_showError(t){term.write("[1;31mERROR:[0m "+t+"\r\n")}_showInfo(t){term.write("[1;34mINFO:[0m "+t+"\r\n")}_promptForInput(){this.localEmulator.read("~$ ").then(t=>this._handleStartCommand(t)).catch(t=>{})}_handleStartCommand(t){this.ws||(this._showError("Connection not established"),this._promptForInput()),this.ws.send(JSON.stringify({type:"run",data:{command:t,env:{}}}))}_handleResize(){const{ws:t,term:e}=this;this.resizeTimer&&clearTimeout(this.resizeTimer),this.resizeTimer=setTimeout(()=>{var r=e.fit();console.log(r,e.rows,e.cols),t&&t.send(JSON.stringify({type:"tty",data:{resize:{width:e.cols,height:e.rows}}}))},250)}_handleSessionData(t){switch(t.type){case"session":this._setMode(t.data.mode);break;case"error":null!=t.data.message&&this._showError(t.data.message);break;case"tty":null!=t.data.output&&term.write(t.data.output)}}_handleTermData(t){"interactive"===this.mode&&null!=this.ws&&this.ws.send(JSON.stringify({type:"tty",data:{input:t}}))}}},function(t,e,r){e.parse=r(3),e.stringify=r(4)},function(t,e){var r,s,i,n,o={'"':'"',"\\":"\\","/":"/",b:"\b",f:"\f",n:"\n",r:"\r",t:"\t"},h=function(t){throw{name:"SyntaxError",message:t,at:r,text:i}},a=function(t){return t&&t!==s&&h("Expected '"+t+"' instead of '"+s+"'"),s=i.charAt(r),r+=1,s},u=function(){var t,e="";for("-"===s&&(e="-",a("-"));s>="0"&&s<="9";)e+=s,a();if("."===s)for(e+=".";a()&&s>="0"&&s<="9";)e+=s;if("e"===s||"E"===s)for(e+=s,a(),"-"!==s&&"+"!==s||(e+=s,a());s>="0"&&s<="9";)e+=s,a();if(t=+e,isFinite(t))return t;h("Bad number")},c=function(){var t,e,r,i="";if('"'===s)for(;a();){if('"'===s)return a(),i;if("\\"===s)if(a(),"u"===s){for(r=0,e=0;e<4&&(t=parseInt(a(),16),isFinite(t));e+=1)r=16*r+t;i+=String.fromCharCode(r)}else{if("string"!=typeof o[s])break;i+=o[s]}else i+=s}h("Bad string")},l=function(){for(;s&&s<=" ";)a()};n=function(){switch(l(),s){case"{":return function(){var t,e={};if("{"===s){if(a("{"),l(),"}"===s)return a("}"),e;for(;s;){if(t=c(),l(),a(":"),Object.hasOwnProperty.call(e,t)&&h('Duplicate key "'+t+'"'),e[t]=n(),l(),"}"===s)return a("}"),e;a(","),l()}}h("Bad object")}();case"[":return function(){var t=[];if("["===s){if(a("["),l(),"]"===s)return a("]"),t;for(;s;){if(t.push(n()),l(),"]"===s)return a("]"),t;a(","),l()}}h("Bad array")}();case'"':return c();case"-":return u();default:return s>="0"&&s<="9"?u():function(){switch(s){case"t":return a("t"),a("r"),a("u"),a("e"),!0;case"f":return a("f"),a("a"),a("l"),a("s"),a("e"),!1;case"n":return a("n"),a("u"),a("l"),a("l"),null}h("Unexpected '"+s+"'")}()}},t.exports=function(t,e){var o;return i=t,r=0,s=" ",o=n(),l(),s&&h("Syntax error"),"function"==typeof e?function t(r,s){var i,n,o=r[s];if(o&&"object"==typeof o)for(i in o)Object.prototype.hasOwnProperty.call(o,i)&&(void 0!==(n=t(o,i))?o[i]=n:delete o[i]);return e.call(r,s,o)}({"":o},""):o}},function(t,e){var r,s,i,n=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,o={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"};function h(t){return n.lastIndex=0,n.test(t)?'"'+t.replace(n,function(t){var e=o[t];return"string"==typeof e?e:"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+t+'"'}t.exports=function(t,e,n){var o;if(r="",s="","number"==typeof n)for(o=0;o<n;o+=1)s+=" ";else"string"==typeof n&&(s=n);if(i=e,e&&"function"!=typeof e&&("object"!=typeof e||"number"!=typeof e.length))throw new Error("JSON.stringify");return function t(e,n){var o,a,u,c,l,p=r,f=n[e];switch(f&&"object"==typeof f&&"function"==typeof f.toJSON&&(f=f.toJSON(e)),"function"==typeof i&&(f=i.call(n,e,f)),typeof f){case"string":return h(f);case"number":return isFinite(f)?String(f):"null";case"boolean":case"null":return String(f);case"object":if(!f)return"null";if(r+=s,l=[],"[object Array]"===Object.prototype.toString.apply(f)){for(c=f.length,o=0;o<c;o+=1)l[o]=t(o,f)||"null";return u=0===l.length?"[]":r?"[\n"+r+l.join(",\n"+r)+"\n"+p+"]":"["+l.join(",")+"]",r=p,u}if(i&&"object"==typeof i)for(c=i.length,o=0;o<c;o+=1)"string"==typeof(a=i[o])&&(u=t(a,f))&&l.push(h(a)+(r?": ":":")+u);else for(a in f)Object.prototype.hasOwnProperty.call(f,a)&&(u=t(a,f))&&l.push(h(a)+(r?": ":":")+u);return u=0===l.length?"{}":r?"{\n"+r+l.join(",\n"+r)+"\n"+p+"}":"{"+l.join(",")+"}",r=p,u}}("",{"":t})}},function(t,e){t.exports=function(t,e){if(t.map)return t.map(e);for(var s=[],i=0;i<t.length;i++){var n=t[i];r.call(t,i)&&s.push(e(n,i,t))}return s};var r=Object.prototype.hasOwnProperty},function(t,e){t.exports=function(t,e){if(t.filter)return t.filter(e);for(var s=[],i=0;i<t.length;i++)r.call(t,i)&&e(t[i],i,t)&&s.push(t[i]);return s};var r=Object.prototype.hasOwnProperty},function(t,e){var r=Object.prototype.hasOwnProperty;t.exports=function(t,e,s){var i=arguments.length>=3;if(i&&t.reduce)return t.reduce(e,s);if(t.reduce)return t.reduce(e);for(var n=0;n<t.length;n++)r.call(t,n)&&(i?s=e(s,t[n],n):(s=t[n],i=!0));return s}},function(t,e,r){"use strict";r.r(e);class s{constructor(t){this.size=t,this.entries=[],this.cursor=0}push(t){if(""===t.trim())return;t!=this.entries[this.entries.length-1]&&(this.entries.push(t),this.entries.length>this.size&&this.entries.pop(0),this.cursor=this.entries.length)}rewind(){this.cursor=this.entries.length}getPrevious(){const t=Math.max(0,this.cursor-1);return this.cursor=t,this.entries[t]}getNext(){const t=Math.min(this.entries.length,this.cursor+1);return this.cursor=t,this.entries[t]}}var i=r(0);function n(t,e=!0){let r;const s=[],i=/\w+/g;for(;r=i.exec(t);)e?s.push(r.index):s.push(r.index+r[0].length);return s}function o(t,e){const r=n(t,!0).reverse().find(t=>t<e);return null==r?0:r}function h(t,e,r){let s=0,i=0;for(let n=0;n<e;++n){"\n"==t.charAt(n)?(i=0,s+=1):(i+=1)>r&&(i=0,s+=1)}return{row:s,col:i}}function a(t,e){return h(t,t.length,e).row+1}function u(t){return null!=t.match(/[^\\][ \t]$/m)}r.d(e,"HistoryController",function(){return s});e.default=class{constructor(t,e={}){this.term=t,this.term.on("data",this.handleTermData.bind(this)),this.term.on("resize",this.handleTermResize.bind(this)),this.history=new s(e.historySize||10),this.maxAutocompleteEntries=e.maxAutocompleteEntries||100,this._autocompleteHandlers=[],this._active=!1,this._input="",this._cursor=0,this._activePrompt=null,this._activeCharPrompt=null,this._termSize={cols:this.term.cols,rows:this.term.rows}}addAutocompleteHandler(t,...e){this._autocompleteHandlers.push({fn:t,args:e})}removeAutocompleteHandler(t){const e=this._autocompleteHandlers.findIndex(e=>e.fn===t);-1!==e&&this._autocompleteHandlers.splice(e,1)}read(t,e="> "){return new Promise((r,s)=>{this.term.write(t),this._activePrompt={prompt:t,continuationPrompt:e,resolve:r,reject:s},this._input="",this._cursor=0,this._active=!0})}readChar(t){return new Promise((e,r)=>{this.term.write(t),this._activeCharPrompt={prompt:t,resolve:e,reject:r}})}abortRead(t="aborted"){null==this._activePrompt&&null==this._activeCharPrompt||this.term.write("\r\n"),null!=this._activePrompt&&(this._activePrompt.reject(t),this._activePrompt=null),null!=this._activeCharPrompt&&(this._activeCharPrompt.reject(t),this._activeCharPrompt=null),this._active=!1}println(t){this.print(t+"\n")}print(t){const e=t.replace(/[\r\n]+/g,"\n");this.term.write(e.replace(/\n/g,"\r\n"))}printWide(t,e=2){if(0==t.length)return println("");const r=t.reduce((t,e)=>Math.max(t,e.length),0)+e,s=Math.floor(this._termSize.cols/r),i=Math.ceil(t.length/s);let n=0;for(let e=0;e<i;++e){let e="";for(let i=0;i<s;++i)if(n<t.length){let s=t[n++];e+=s+=" ".repeat(r-s.length)}this.println(e)}}applyPrompts(t){const e=(this._activePrompt||{}).prompt||"",r=(this._activePrompt||{}).continuationPrompt||"";return e+t.replace(/\n/g,"\n"+r)}applyPromptOffset(t,e){return this.applyPrompts(t.substr(0,e)).length}clearInput(){const t=this.applyPrompts(this._input),e=a(t,this._termSize.cols),r=this.applyPromptOffset(this._input,this._cursor),{col:s,row:i}=h(t,r,this._termSize.cols),n=e-i-1;for(var o=0;o<n;++o)this.term.write("[E");for(this.term.write("\r[K"),o=1;o<e;++o)this.term.write("[F[K")}setInput(t,e=!0){e&&this.clearInput();const r=this.applyPrompts(t);this.print(r),this._cursor>t.length&&(this._cursor=t.length);const s=this.applyPromptOffset(t,this._cursor),i=a(r,this._termSize.cols),{col:n,row:o}=h(r,s,this._termSize.cols),u=i-o-1;this.term.write("\r");for(var c=0;c<u;++c)this.term.write("[F");for(c=0;c<n;++c)this.term.write("[C");this._input=t}printAndRestartPrompt(t){const e=this._cursor;this.setCursor(this._input.length),this.term.write("\r\n");const r=()=>{this._cursor=e,this.setInput(this._input)},s=t();null==s?r():s.then(r)}setCursor(t){t<0&&(t=0),t>this._input.length&&(t=this._input.length);const e=this.applyPrompts(this._input),r=(a(e,this._termSize.cols),this.applyPromptOffset(this._input,this._cursor)),{col:s,row:i}=h(e,r,this._termSize.cols),n=this.applyPromptOffset(this._input,t),{col:o,row:u}=h(e,n,this._termSize.cols);if(u>i)for(let t=i;t<u;++t)this.term.write("[B");else for(let t=u;t<i;++t)this.term.write("[A");if(o>s)for(let t=s;t<o;++t)this.term.write("[C");else for(let t=o;t<s;++t)this.term.write("[D");this._cursor=t}handleCursorMove(t){if(t>0){const e=Math.min(t,this._input.length-this._cursor);this.setCursor(this._cursor+e)}else if(t<0){const e=Math.max(t,-this._cursor);this.setCursor(this._cursor+e)}}handleCursorErase(t){const{_cursor:e,_input:r}=this;if(t){if(e<=0)return;const t=r.substr(0,e-1)+r.substr(e);this.clearInput(),this._cursor-=1,this.setInput(t,!1)}else{const t=r.substr(0,e)+r.substr(e+1);this.setInput(t)}}handleCursorInsert(t){const{_cursor:e,_input:r}=this,s=r.substr(0,e)+t+r.substr(e);this._cursor+=t.length,this.setInput(s)}handleReadComplete(){this.history&&this.history.push(this._input),this._activePrompt&&(this._activePrompt.resolve(this._input),this._activePrompt=null),this.term.write("\r\n"),this._active=!1}handleTermResize(t){const{rows:e,cols:r}=t;this.clearInput(),this._termSize={cols:r,rows:e},this.setInput(this._input,!1)}handleTermData(t){if(this._active){if(null!=this._activeCharPrompt)return this._activeCharPrompt.resolve(t),this._activeCharPrompt=null,void this.term.write("\r\n");if(t.length>3&&27!==t.charCodeAt(0)){const e=t.replace(/[\r\n]+/g,"\r");Array.from(e).forEach(t=>this.handleData(t))}else this.handleData(t)}}handleData(t){if(!this._active)return;const e=t.charCodeAt(0);let r;if(27==e)switch(t.substr(1)){case"[A":if(this.history){let t=this.history.getPrevious();t&&(this.setInput(t),this.setCursor(t.length))}break;case"[B":if(this.history){let t=this.history.getNext();t||(t=""),this.setInput(t),this.setCursor(t.length)}break;case"[D":this.handleCursorMove(-1);break;case"[C":this.handleCursorMove(1);break;case"[3~":this.handleCursorErase(!1);break;case"[F":this.setCursor(this._input.length);break;case"[H":this.setCursor(0);break;case"b":null!=(r=o(this._input,this._cursor))&&this.setCursor(r);break;case"f":null!=(r=function(t,e){const r=n(t,!1).find(t=>t>e);return null==r?t.length:r}(this._input,this._cursor))&&this.setCursor(r);break;case"":null!=(r=o(this._input,this._cursor))&&(this.setInput(this._input.substr(0,r)+this._input.substr(this._cursor)),this.setCursor(r))}else if(e<32||127===e)switch(t){case"\r":""!=(s=this._input).trim()&&((s.match(/'/g)||[]).length%2!=0||(s.match(/"/g)||[]).length%2!=0||""==s.split(/(\|\||\||&&)/g).pop().trim()||s.endsWith("\\")&&!s.endsWith("\\\\"))?this.handleCursorInsert("\n"):this.handleReadComplete();break;case"":this.handleCursorErase(!0);break;case"\t":if(this._autocompleteHandlers.length>0){const t=this._input.substr(0,this._cursor),e=u(t),r=function(t,e){const r=Object(i.parse)(e);let s=r.length-1,n=r[s]||"";return""===e.trim()?(s=0,n=""):u(e)&&(s+=1,n=""),t.reduce((t,{fn:e,args:i})=>{try{return t.concat(e(s,r,...i))}catch(e){return console.error("Auto-complete error:",e),t}},[]).filter(t=>t.startsWith(n))}(this._autocompleteHandlers,t);if(r.sort(),0===r.length)e||this.handleCursorInsert(" ");else if(1===r.length){const e=function(t){return""===t.trim()?"":u(t)?"":Object(i.parse)(t).pop()||""}(t);this.handleCursorInsert(r[0].substr(e.length)+" ")}else r.length<=this.maxAutocompleteEntries?this.printAndRestartPrompt(()=>{this.printWide(r)}):this.printAndRestartPrompt(()=>this.readChar(`Display all ${r.length} possibilities? (y or n)`).then(t=>{"y"!=t&&"Y"!=t||this.printWide(r)}))}else this.handleCursorInsert("    ");break;case"":this.setCursor(this._input.length),this.term.write("^C\r\n"+((this._activePrompt||{}).prompt||"")),this._input="",this._cursor=0,this.history&&this.history.rewind()}else this.handleCursorInsert(t);var s}}}])});