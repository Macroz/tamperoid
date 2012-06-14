goog.provide('tampere.core');
goog.require('cljs.core');
/**
* Recursively transforms ClojureScript maps into Javascript objects,
* other ClojureScript colls into JavaScript arrays, and ClojureScript
* keywords into JavaScript strings.
*/
tampere.core.clj__GT_js = (function clj__GT_js(x){
if(cljs.core.string_QMARK_.call(null,x))
{return x;
} else
{if(cljs.core.keyword_QMARK_.call(null,x))
{return cljs.core.name.call(null,x);
} else
{if(cljs.core.map_QMARK_.call(null,x))
{return cljs.core.reduce.call(null,(function (m,p__591794){
var vec__591795__591796 = p__591794;
var k__591797 = cljs.core.nth.call(null,vec__591795__591796,0,null);
var v__591798 = cljs.core.nth.call(null,vec__591795__591796,1,null);
return cljs.core.assoc.call(null,m,clj__GT_js.call(null,k__591797),clj__GT_js.call(null,v__591798));
}),cljs.core.ObjMap.fromObject([],{}),x).strobj;
} else
{if(cljs.core.coll_QMARK_.call(null,x))
{return cljs.core.apply.call(null,cljs.core.array,cljs.core.map.call(null,clj__GT_js,x));
} else
{if("\uFDD0'else")
{return x;
} else
{return null;
}
}
}
}
}
});
tampere.core.data = cljs.core.atom.call(null,cljs.core.ObjMap.fromObject(["\uFDD0'asteroids","\uFDD0'y","\uFDD0'score","\uFDD0'x","\uFDD0'dir","\uFDD0'bullets","\uFDD0'dead?","\uFDD0'nasteroids","\uFDD0'advance","\uFDD0'tx","\uFDD0'level","\uFDD0'ty"],{"\uFDD0'asteroids":cljs.core.PersistentVector.fromArray([]),"\uFDD0'y":0,"\uFDD0'score":0,"\uFDD0'x":0,"\uFDD0'dir":cljs.core.ObjMap.fromObject(["\uFDD0'dx","\uFDD0'dy"],{"\uFDD0'dx":1,"\uFDD0'dy":0}),"\uFDD0'bullets":cljs.core.PersistentVector.fromArray([]),"\uFDD0'dead?":false,"\uFDD0'nasteroids":0,"\uFDD0'advance":0,"\uFDD0'tx":0,"\uFDD0'level":0,"\uFDD0'ty":0}));
tampere.core.gee = cljs.core.atom.call(null,null);
tampere.core.ctx = cljs.core.atom.call(null,null);
tampere.core.circle = (function circle(x,y,rad){
cljs.core.deref.call(null,tampere.core.ctx).beginPath();
cljs.core.deref.call(null,tampere.core.ctx).arc(x,y,rad,rad,0,(2.0 * Math.PI),true);
cljs.core.deref.call(null,tampere.core.ctx).closePath();
return cljs.core.deref.call(null,tampere.core.ctx).fill();
});
tampere.core.line = (function line(x1,y1,x2,y2){
cljs.core.deref.call(null,tampere.core.ctx).beginPath();
cljs.core.deref.call(null,tampere.core.ctx).moveTo(x1,y1);
cljs.core.deref.call(null,tampere.core.ctx).lineTo(x2,y2);
cljs.core.deref.call(null,tampere.core.ctx).closePath();
return cljs.core.deref.call(null,tampere.core.ctx).stroke();
});
tampere.core.on_screen_QMARK_ = (function on_screen_QMARK_(p__591799){
var map__591800__591801 = p__591799;
var map__591800__591802 = ((cljs.core.seq_QMARK_.call(null,map__591800__591801))?cljs.core.apply.call(null,cljs.core.hash_map,map__591800__591801):map__591800__591801);
var x__591803 = cljs.core.get.call(null,map__591800__591802,"\uFDD0'x");
var y__591804 = cljs.core.get.call(null,map__591800__591802,"\uFDD0'y");
var width__591805 = cljs.core.deref.call(null,tampere.core.gee).width;
var height__591806 = cljs.core.deref.call(null,tampere.core.gee).height;
var and__3546__auto____591807 = (0 < (x__591803 + 1));
if(and__3546__auto____591807)
{var and__3546__auto____591808 = (x__591803 < (width__591805 + 1));
if(and__3546__auto____591808)
{var and__3546__auto____591809 = (0 < (y__591804 + 1));
if(and__3546__auto____591809)
{return (y__591804 < (height__591806 + 1));
} else
{return and__3546__auto____591809;
}
} else
{return and__3546__auto____591808;
}
} else
{return and__3546__auto____591807;
}
});
tampere.core.generate_asteroid = (function generate_asteroid(){
var width__591811 = cljs.core.deref.call(null,tampere.core.gee).width;
var height__591812 = cljs.core.deref.call(null,tampere.core.gee).height;
var r__591813 = cljs.core.rand_int.call(null,4);
var r2__591814 = cljs.core.rand.call(null,180);
var speed__591815 = (((5 + cljs.core.rand.call(null,5)) + cljs.core.rand.call(null,10)) + cljs.core.rand.call(null,20));
var vec__591810__591816 = (((3 === r__591813))?cljs.core.PersistentVector.fromArray([5,cljs.core.rand.call(null,height__591812),(260 + r2__591814)]):(((2 === r__591813))?cljs.core.PersistentVector.fromArray([cljs.core.rand.call(null,width__591811),(height__591812 - 5),(- r2__591814)]):(((1 === r__591813))?cljs.core.PersistentVector.fromArray([(width__591811 - 5),cljs.core.rand.call(null,height__591812),(90 + r2__591814)]):(((0 === r__591813))?cljs.core.PersistentVector.fromArray([cljs.core.rand.call(null,width__591811),5,r2__591814]):(("\uFDD0'else")?(function(){throw (new Error([cljs.core.str("No matching clause: "),cljs.core.str(r__591813)].join('')))})():null)))));
var x__591817 = cljs.core.nth.call(null,vec__591810__591816,0,null);
var y__591818 = cljs.core.nth.call(null,vec__591810__591816,1,null);
var d__591819 = cljs.core.nth.call(null,vec__591810__591816,2,null);
var new_asteroid__591820 = cljs.core.ObjMap.fromObject(["\uFDD0'x","\uFDD0'y","\uFDD0'dir","\uFDD0'size","\uFDD0'life"],{"\uFDD0'x":x__591817,"\uFDD0'y":y__591818,"\uFDD0'dir":cljs.core.ObjMap.fromObject(["\uFDD0'dx","\uFDD0'dy"],{"\uFDD0'dx":(speed__591815 * Math.cos.call(null,(Math.PI * (d__591819 / 180.0)))),"\uFDD0'dy":(speed__591815 * Math.sin.call(null,(Math.PI * (d__591819 / 180.0))))}),"\uFDD0'size":((5 + cljs.core.rand_int.call(null,25)) + cljs.core.rand_int.call(null,10)),"\uFDD0'life":1});
var asteroids__591821 = cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'asteroids");
return cljs.core.swap_BANG_.call(null,tampere.core.data,(function (){
return cljs.core.assoc.call(null,cljs.core.deref.call(null,tampere.core.data),"\uFDD0'asteroids",cljs.core.conj.call(null,asteroids__591821,new_asteroid__591820));
}));
});
tampere.core.start_level = (function start_level(){
var level__591822 = (cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'level") + 1);
return cljs.core.swap_BANG_.call(null,tampere.core.data,(function (){
return cljs.core.assoc.call(null,cljs.core.deref.call(null,tampere.core.data),"\uFDD0'nasteroids",Math.round.call(null,(level__591822 * Math.sqrt.call(null,level__591822))),"\uFDD0'advance",0,"\uFDD0'level",level__591822);
}));
});
tampere.core.move_object = (function move_object(object){
var map__591823__591825 = object;
var map__591823__591826 = ((cljs.core.seq_QMARK_.call(null,map__591823__591825))?cljs.core.apply.call(null,cljs.core.hash_map,map__591823__591825):map__591823__591825);
var x__591827 = cljs.core.get.call(null,map__591823__591826,"\uFDD0'x");
var y__591828 = cljs.core.get.call(null,map__591823__591826,"\uFDD0'y");
var map__591824__591829 = cljs.core.get.call(null,map__591823__591826,"\uFDD0'dir");
var map__591824__591830 = ((cljs.core.seq_QMARK_.call(null,map__591824__591829))?cljs.core.apply.call(null,cljs.core.hash_map,map__591824__591829):map__591824__591829);
var dx__591831 = cljs.core.get.call(null,map__591824__591830,"\uFDD0'dx");
var dy__591832 = cljs.core.get.call(null,map__591824__591830,"\uFDD0'dy");
var life__591833 = cljs.core.get.call(null,map__591823__591826,"\uFDD0'life");
return cljs.core.assoc.call(null,object,"\uFDD0'x",(x__591827 + dx__591831),"\uFDD0'y",(y__591828 + dy__591832));
});
tampere.core.alive_QMARK_ = (function alive_QMARK_(object){
return (object.call(null,"\uFDD0'life") > 0);
});
tampere.core.decrease_life = (function decrease_life(object){
return cljs.core.assoc.call(null,object,"\uFDD0'life",(object.call(null,"\uFDD0'life") - 1));
});
tampere.core.collide_QMARK_ = (function collide_QMARK_(object1,object2){
var map__591834__591836 = object1;
var map__591834__591837 = ((cljs.core.seq_QMARK_.call(null,map__591834__591836))?cljs.core.apply.call(null,cljs.core.hash_map,map__591834__591836):map__591834__591836);
var x1__591838 = cljs.core.get.call(null,map__591834__591837,"\uFDD0'x");
var y1__591839 = cljs.core.get.call(null,map__591834__591837,"\uFDD0'y");
var size1__591840 = cljs.core.get.call(null,map__591834__591837,"\uFDD0'size");
var map__591835__591841 = object2;
var map__591835__591842 = ((cljs.core.seq_QMARK_.call(null,map__591835__591841))?cljs.core.apply.call(null,cljs.core.hash_map,map__591835__591841):map__591835__591841);
var x2__591843 = cljs.core.get.call(null,map__591835__591842,"\uFDD0'x");
var y2__591844 = cljs.core.get.call(null,map__591835__591842,"\uFDD0'y");
var size2__591845 = cljs.core.get.call(null,map__591835__591842,"\uFDD0'size");
var dx__591846 = (x1__591838 - x2__591843);
var dy__591847 = (y1__591839 - y2__591844);
return (((dx__591846 * dx__591846) + (dy__591847 * dy__591847)) < ((size1__591840 * size1__591840) + (size2__591845 * size2__591845)));
});
tampere.core.simulate = (function simulate(){
var map__591848__591849 = cljs.core.deref.call(null,tampere.core.data);
var map__591848__591850 = ((cljs.core.seq_QMARK_.call(null,map__591848__591849))?cljs.core.apply.call(null,cljs.core.hash_map,map__591848__591849):map__591848__591849);
var x__591851 = cljs.core.get.call(null,map__591848__591850,"\uFDD0'x");
var y__591852 = cljs.core.get.call(null,map__591848__591850,"\uFDD0'y");
var tx__591853 = cljs.core.get.call(null,map__591848__591850,"\uFDD0'tx");
var ty__591854 = cljs.core.get.call(null,map__591848__591850,"\uFDD0'ty");
var dx__591855 = (tx__591853 - x__591851);
var dy__591856 = (ty__591854 - y__591852);
var len__591857 = Math.sqrt.call(null,((dx__591855 * dx__591855) + (dy__591856 * dy__591856)));
var speed__591858 = 0.1;
if((len__591857 > 0))
{cljs.core.swap_BANG_.call(null,tampere.core.data,(function (){
return cljs.core.assoc.call(null,cljs.core.deref.call(null,tampere.core.data),"\uFDD0'x",(x__591851 + (dx__591855 * speed__591858)),"\uFDD0'y",(y__591852 + (dy__591856 * speed__591858)),"\uFDD0'dir",cljs.core.ObjMap.fromObject(["\uFDD0'dx","\uFDD0'dy"],{"\uFDD0'dx":(dx__591855 / len__591857),"\uFDD0'dy":(dy__591856 / len__591857)}));
}));
} else
{}
if(cljs.core.truth_(cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'shooting?")))
{cljs.core.swap_BANG_.call(null,tampere.core.data,(function (){
return cljs.core.assoc.call(null,cljs.core.deref.call(null,tampere.core.data),"\uFDD0'bullets",cljs.core.concat.call(null,cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'bullets"),(function (){var nbullets__591859 = ((2 * Math.round.call(null,(cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'level") / 3))) + 1);
var iter__625__auto____591874 = (function iter__591860(s__591861){
return (new cljs.core.LazySeq(null,false,(function (){
var s__591861__591862 = s__591861;
while(true){
if(cljs.core.truth_(cljs.core.seq.call(null,s__591861__591862)))
{var b__591863 = cljs.core.first.call(null,s__591861__591862);
return cljs.core.cons.call(null,(function (){var x__591865 = cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'x");
var y__591866 = cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'y");
var bspeed__591867 = 80;
var map__591864__591868 = cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'dir");
var map__591864__591869 = ((cljs.core.seq_QMARK_.call(null,map__591864__591868))?cljs.core.apply.call(null,cljs.core.hash_map,map__591864__591868):map__591864__591868);
var dx__591870 = cljs.core.get.call(null,map__591864__591869,"\uFDD0'dx");
var dy__591871 = cljs.core.get.call(null,map__591864__591869,"\uFDD0'dy");
var a__591872 = (((Math.PI / 2) + (- Math.atan2.call(null,dx__591870,dy__591871))) + ((cljs.core._EQ_.call(null,b__591863,0))?0:((Math.floor.call(null,((b__591863 - 1) / 2)) * ((2 * (b__591863 % 2)) - 1)) * 0.12)));
var dir__591873 = cljs.core.ObjMap.fromObject(["\uFDD0'dx","\uFDD0'dy"],{"\uFDD0'dx":(bspeed__591867 * Math.cos.call(null,a__591872)),"\uFDD0'dy":(bspeed__591867 * Math.sin.call(null,a__591872))});
return cljs.core.ObjMap.fromObject(["\uFDD0'x","\uFDD0'y","\uFDD0'dir","\uFDD0'life","\uFDD0'size"],{"\uFDD0'x":x__591865,"\uFDD0'y":y__591866,"\uFDD0'dir":dir__591873,"\uFDD0'life":20,"\uFDD0'size":1});
})(),iter__591860.call(null,cljs.core.rest.call(null,s__591861__591862)));
} else
{return null;
}
break;
}
})));
});
return iter__625__auto____591874.call(null,cljs.core.range.call(null,nbullets__591859));
})()));
}));
} else
{}
cljs.core.swap_BANG_.call(null,tampere.core.data,(function (){
return cljs.core.assoc.call(null,cljs.core.deref.call(null,tampere.core.data),"\uFDD0'asteroids",cljs.core.filter.call(null,tampere.core.on_screen_QMARK_,(function (){var iter__625__auto____591879 = (function iter__591875(s__591876){
return (new cljs.core.LazySeq(null,false,(function (){
var s__591876__591877 = s__591876;
while(true){
if(cljs.core.truth_(cljs.core.seq.call(null,s__591876__591877)))
{var asteroid__591878 = cljs.core.first.call(null,s__591876__591877);
return cljs.core.cons.call(null,tampere.core.move_object.call(null,asteroid__591878),iter__591875.call(null,cljs.core.rest.call(null,s__591876__591877)));
} else
{return null;
}
break;
}
})));
});
return iter__625__auto____591879.call(null,cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'asteroids"));
})()));
}));
cljs.core.swap_BANG_.call(null,tampere.core.data,(function (){
return cljs.core.assoc.call(null,cljs.core.deref.call(null,tampere.core.data),"\uFDD0'bullets",cljs.core.filter.call(null,tampere.core.alive_QMARK_,(function (){var iter__625__auto____591884 = (function iter__591880(s__591881){
return (new cljs.core.LazySeq(null,false,(function (){
var s__591881__591882 = s__591881;
while(true){
if(cljs.core.truth_(cljs.core.seq.call(null,s__591881__591882)))
{var bullet__591883 = cljs.core.first.call(null,s__591881__591882);
return cljs.core.cons.call(null,tampere.core.decrease_life.call(null,tampere.core.move_object.call(null,bullet__591883)),iter__591880.call(null,cljs.core.rest.call(null,s__591881__591882)));
} else
{return null;
}
break;
}
})));
});
return iter__625__auto____591884.call(null,cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'bullets"));
})()));
}));
var n1__591885 = cljs.core.count.call(null,cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'asteroids"));
cljs.core.swap_BANG_.call(null,tampere.core.data,(function (){
return cljs.core.assoc.call(null,cljs.core.deref.call(null,tampere.core.data),"\uFDD0'asteroids",cljs.core.filter.call(null,tampere.core.alive_QMARK_,(function (){var iter__625__auto____591890 = (function iter__591886(s__591887){
return (new cljs.core.LazySeq(null,false,(function (){
var s__591887__591888 = s__591887;
while(true){
if(cljs.core.truth_(cljs.core.seq.call(null,s__591887__591888)))
{var asteroid__591889 = cljs.core.first.call(null,s__591887__591888);
return cljs.core.cons.call(null,((cljs.core.empty_QMARK_.call(null,cljs.core.filter.call(null,cljs.core.partial.call(null,tampere.core.collide_QMARK_,asteroid__591889),cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'bullets"))))?asteroid__591889:cljs.core.assoc.call(null,asteroid__591889,"\uFDD0'life",(asteroid__591889.call(null,"\uFDD0'life") - 1))),iter__591886.call(null,cljs.core.rest.call(null,s__591887__591888)));
} else
{return null;
}
break;
}
})));
});
return iter__625__auto____591890.call(null,cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'asteroids"));
})()));
}));
var killed__591891 = (n1__591885 - cljs.core.count.call(null,cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'asteroids")));
cljs.core.swap_BANG_.call(null,tampere.core.data,(function (){
return cljs.core.assoc.call(null,cljs.core.deref.call(null,tampere.core.data),"\uFDD0'advance",(cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'advance") + killed__591891),"\uFDD0'score",(cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'score") + (cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'level") * killed__591891)));
}));
if(cljs.core.empty_QMARK_.call(null,cljs.core.filter.call(null,cljs.core.partial.call(null,tampere.core.collide_QMARK_,cljs.core.deref.call(null,tampere.core.data)),cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'asteroids"))))
{} else
{cljs.core.swap_BANG_.call(null,tampere.core.data,(function (){
return cljs.core.assoc.call(null,cljs.core.deref.call(null,tampere.core.data),"\uFDD0'dead?",true);
}));
}
if((cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'advance") >= cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'nasteroids")))
{tampere.core.start_level.call(null);
} else
{}
if((cljs.core.count.call(null,cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'asteroids")) < cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'nasteroids")))
{return tampere.core.generate_asteroid.call(null);
} else
{return null;
}
});
tampere.core.draw = (function draw(){
if(cljs.core.truth_(cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'dead?")))
{} else
{tampere.core.simulate.call(null);
}
var width__591892 = cljs.core.deref.call(null,tampere.core.gee).width;
var height__591893 = cljs.core.deref.call(null,tampere.core.gee).height;
cljs.core.deref.call(null,tampere.core.ctx).fillStyle = "rgb(0, 0, 0)";
cljs.core.deref.call(null,tampere.core.ctx).fillRect(0,0,width__591892,height__591893);
cljs.core.deref.call(null,tampere.core.ctx).fillStyle = "rgb(255, 255, 255)";
cljs.core.deref.call(null,tampere.core.ctx).strokeStyle = "rgba(255, 255, 255, 0.2)";
if(cljs.core.truth_(cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'dead?")))
{} else
{tampere.core.line.call(null,"\uFDD0'x".call(null,cljs.core.deref.call(null,tampere.core.data)),"\uFDD0'y".call(null,cljs.core.deref.call(null,tampere.core.data)),"\uFDD0'tx".call(null,cljs.core.deref.call(null,tampere.core.data)),"\uFDD0'ty".call(null,cljs.core.deref.call(null,tampere.core.data)));
}
tampere.core.circle.call(null,"\uFDD0'x".call(null,cljs.core.deref.call(null,tampere.core.data)),"\uFDD0'y".call(null,cljs.core.deref.call(null,tampere.core.data)),20);
cljs.core.deref.call(null,tampere.core.ctx).fillStyle = "rgb(255, 255, 255)";
cljs.core.deref.call(null,tampere.core.ctx).font = "bold 30px sans-serif";
cljs.core.deref.call(null,tampere.core.ctx).textAlign = "left";
cljs.core.deref.call(null,tampere.core.ctx).textBaseline = "middle";
cljs.core.deref.call(null,tampere.core.ctx).font = "20pt Courier New";
cljs.core.deref.call(null,tampere.core.ctx).fillText([cljs.core.str("fps "),cljs.core.str(Math.round.call(null,cljs.core.deref.call(null,tampere.core.gee).frameRate))].join(''),50,40);
cljs.core.deref.call(null,tampere.core.ctx).fillText([cljs.core.str("level "),cljs.core.str(cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'level")),cljs.core.str("("),cljs.core.str((cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'nasteroids") - cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'advance"))),cljs.core.str(")")].join(''),50,80);
cljs.core.deref.call(null,tampere.core.ctx).fillText([cljs.core.str("score "),cljs.core.str(cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'score"))].join(''),50,120);
if(cljs.core.truth_(cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'dead?")))
{cljs.core.deref.call(null,tampere.core.ctx).textAlign = "center";
cljs.core.deref.call(null,tampere.core.ctx).font = "60pt Courier New";
cljs.core.deref.call(null,tampere.core.ctx).fillText([cljs.core.str("G A M E  O V E R")].join(''),(width__591892 / 2),(height__591893 / 2));
} else
{}
cljs.core.dorun.call(null,(function (){var iter__625__auto____591908 = (function iter__591894(s__591895){
return (new cljs.core.LazySeq(null,false,(function (){
var s__591895__591896 = s__591895;
while(true){
if(cljs.core.truth_(cljs.core.seq.call(null,s__591895__591896)))
{var bullet__591897 = cljs.core.first.call(null,s__591895__591896);
return cljs.core.cons.call(null,(function (){var map__591898__591900 = bullet__591897;
var map__591898__591901 = ((cljs.core.seq_QMARK_.call(null,map__591898__591900))?cljs.core.apply.call(null,cljs.core.hash_map,map__591898__591900):map__591898__591900);
var x__591902 = cljs.core.get.call(null,map__591898__591901,"\uFDD0'x");
var y__591903 = cljs.core.get.call(null,map__591898__591901,"\uFDD0'y");
var map__591899__591904 = cljs.core.get.call(null,map__591898__591901,"\uFDD0'dir");
var map__591899__591905 = ((cljs.core.seq_QMARK_.call(null,map__591899__591904))?cljs.core.apply.call(null,cljs.core.hash_map,map__591899__591904):map__591899__591904);
var dx__591906 = cljs.core.get.call(null,map__591899__591905,"\uFDD0'dx");
var dy__591907 = cljs.core.get.call(null,map__591899__591905,"\uFDD0'dy");
cljs.core.deref.call(null,tampere.core.ctx).strokeStyle = "rgba(255, 255, 255, 0.5)";
return tampere.core.line.call(null,x__591902,y__591903,(x__591902 - dx__591906),(y__591903 - dy__591907));
})(),iter__591894.call(null,cljs.core.rest.call(null,s__591895__591896)));
} else
{return null;
}
break;
}
})));
});
return iter__625__auto____591908.call(null,cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'bullets"));
})());
return cljs.core.dorun.call(null,(function (){var iter__625__auto____591924 = (function iter__591909(s__591910){
return (new cljs.core.LazySeq(null,false,(function (){
var s__591910__591911 = s__591910;
while(true){
if(cljs.core.truth_(cljs.core.seq.call(null,s__591910__591911)))
{var asteroid__591912 = cljs.core.first.call(null,s__591910__591911);
return cljs.core.cons.call(null,(function (){var map__591913__591915 = asteroid__591912;
var map__591913__591916 = ((cljs.core.seq_QMARK_.call(null,map__591913__591915))?cljs.core.apply.call(null,cljs.core.hash_map,map__591913__591915):map__591913__591915);
var x__591917 = cljs.core.get.call(null,map__591913__591916,"\uFDD0'x");
var y__591918 = cljs.core.get.call(null,map__591913__591916,"\uFDD0'y");
var map__591914__591919 = cljs.core.get.call(null,map__591913__591916,"\uFDD0'dir");
var map__591914__591920 = ((cljs.core.seq_QMARK_.call(null,map__591914__591919))?cljs.core.apply.call(null,cljs.core.hash_map,map__591914__591919):map__591914__591919);
var dx__591921 = cljs.core.get.call(null,map__591914__591920,"\uFDD0'dx");
var dy__591922 = cljs.core.get.call(null,map__591914__591920,"\uFDD0'dy");
var size__591923 = cljs.core.get.call(null,map__591913__591916,"\uFDD0'size");
cljs.core.deref.call(null,tampere.core.ctx).strokeStyle = "rgba(0, 200, 0, 0.5)";
cljs.core.deref.call(null,tampere.core.ctx).fillStyle = "rgb(0, 200, 0)";
return tampere.core.circle.call(null,x__591917,y__591918,size__591923);
})(),iter__591909.call(null,cljs.core.rest.call(null,s__591910__591911)));
} else
{return null;
}
break;
}
})));
});
return iter__625__auto____591924.call(null,cljs.core.deref.call(null,tampere.core.data).call(null,"\uFDD0'asteroids"));
})());
});
tampere.core.move = (function move(){
return cljs.core.swap_BANG_.call(null,tampere.core.data,(function (){
return cljs.core.assoc.call(null,cljs.core.deref.call(null,tampere.core.data),"\uFDD0'tx",cljs.core.deref.call(null,tampere.core.gee).mouseX,"\uFDD0'ty",cljs.core.deref.call(null,tampere.core.gee).mouseY);
}));
});
tampere.core.noshoot = (function noshoot(){
return cljs.core.swap_BANG_.call(null,tampere.core.data,(function (){
return cljs.core.assoc.call(null,cljs.core.deref.call(null,tampere.core.data),"\uFDD0'shooting?",false);
}));
});
tampere.core.shoot = (function shoot(){
return cljs.core.swap_BANG_.call(null,tampere.core.data,(function (){
return cljs.core.assoc.call(null,cljs.core.deref.call(null,tampere.core.data),"\uFDD0'shooting?",true);
}));
});
tampere.core.start = (function start(){
cljs.core.swap_BANG_.call(null,tampere.core.gee,(function (){
return (new window.GEE(tampere.core.clj__GT_js.call(null,cljs.core.ObjMap.fromObject(["\uFDD0'fullscreen","\uFDD0'context"],{"\uFDD0'fullscreen":true,"\uFDD0'context":"2d"}))));
}));
cljs.core.swap_BANG_.call(null,tampere.core.ctx,(function (){
return cljs.core.deref.call(null,tampere.core.gee).ctx;
}));
cljs.core.deref.call(null,tampere.core.gee).draw = tampere.core.draw;
cljs.core.deref.call(null,tampere.core.gee).mousemove = tampere.core.move;
cljs.core.deref.call(null,tampere.core.gee).mousedown = tampere.core.shoot;
cljs.core.deref.call(null,tampere.core.gee).mouseup = tampere.core.noshoot;
cljs.core.deref.call(null,tampere.core.gee).mousedrag = tampere.core.move;
return document.body.appendChild(tampere.core.gee.domElement);
});
