function getImage(src, cb) {
  var img = new Image();
  img.onload = function() {
    var height = img.height;
    var width = img.width;
    cb(img);
  }
  img.src = src;
}

var doRotate = function(canvas, img, rot){
    //获取图片的高宽
    var w = img.width;
    var h = img.height;
    //角度转为弧度
    if(!rot) rot = 0;	
    var rotation = Math.PI * rot / 180;
    var c = Math.round(Math.cos(rotation) * 1000) / 1000;
    var s = Math.round(Math.sin(rotation) * 1000) / 1000;
    //旋转后canvas标签的大小
    canvas.height = Math.abs(c*h) + Math.abs(s*w);
    canvas.width = Math.abs(c*w) + Math.abs(s*h);
    //绘图开始
    var context = canvas.getContext("2d");
    context.save();
    //改变中心点
    if (rotation <= Math.PI/2) {
        context.translate(s*h,0);
    } else if (rotation <= Math.PI) {
        context.translate(canvas.width,-c*h);
    } else if (rotation <= 1.5*Math.PI) {
        context.translate(-c*w,canvas.height);
    } else {
        context.translate(0,-s*w);
    }
    //旋转90°
    context.rotate(rotation);
    //绘制
    context.drawImage(img, 0, 0, w, h);
    context.restore();
};

/*
 * direction: 1:right, -1:left
 * rotate('./images/f2.jpg', 1, function(image){
 *   fabric.Image.fromURL(image, function(fabricImg) {
 *     fabricImg.set({
 *       left: 20, 
 *       top: 20
 *     });
 *     canvas.add(fabricImg);
 *   });
 * });
 */
function rotate(src, direction, cb) {
  var img = new Image();
  img.onload = function() {
    //
    var canvas = fabric.util.createCanvasElement();
    if(direction===1) {
      doRotate(canvas, this, 90);
    } else if(direction===-1) {
      doRotate(canvas, this, 270);
    }
    cb(canvas.toDataURL('image/png'));
  };
  img.src = src;
}

/* 
 * cx, cy, cw, ch: 在原图上裁切的位置和长宽
 * width, height: 结果的长宽
 *
 * clip('./images/f1.jpg', 10, 10, 30, 30, 60, 30, function(image){
 *  fabric.Image.fromURL(image, function(oImg) {
 *    oImg.set({
 *      left: 20, 
 *      top: 20
 *    });
 *    canvas.add(oImg);
 *  });
 * });
 */
function clip(src, /* */cx, cy, cw, ch, /* */width, height, /* */cb) {
  var img = new Image();
  img.onload = function() {
    //
    var canvas = fabric.util.createCanvasElement();
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(this, cx, cy, cw, ch, 0, 0, width, height);
    cb(canvas.toDataURL('image/png'));
  };
  img.src = src;
}

function Frame(canvas, left, top, width, height, angle) {
  this.canvas = canvas;
  this.left = left;
  this.top = top;
  this.width = width;
  this.height = height;
  this.angle = angle;
}

Frame.prototype.setImage = function(src){
  this.src = src;
  var _this = this;

  // 获取图片的长宽，然后切出需要的放入canvas
  getImage(src, function(img){
    _this.oriImage = img;
    
    if( _this.width/_this.height >= img.width/img.height ) { // 如果是竖状的图片，切中间的图片放入相框
      var ratio = img.width/_this.width;
      var cx = 0, cy = (img.height-_this.height*ratio)/2, cw = _this.width*ratio, ch = _this.height*ratio;  
    } else { // 如果是横状的图片，切中间的图片放入相框
      var ratio = img.height/_this.height;
      var cx = (img.width-_this.width*ratio)/2, cy = 0, cw = _this.width*ratio, ch = _this.height*ratio;
    }
    
    // 切图
    // clip(src, cx, cy, cw, ch, _this.width, _this.height, function(imageData){
    clip(src, cx, cy, cw, ch, cw, ch, function(imageData) {
      
      if(_this.fabricImg) {
        
        var tmpImg = new Image();
        tmpImg.onload = function() {
          _this.fabricImg.setElement(this);
          _this.fabricImg.scale(1/ratio);
          _this.fabricImg.applyFilters(_this.canvas.renderAll.bind(_this.canvas));
        }
        tmpImg.src = imageData;
        
      } else {
        
        // 切好后放入相框
        fabric.Image.fromURL(imageData, function(fabricImg) {
          fabricImg.scale(1/ratio).set({
            left: _this.left, 
            top: _this.top,
            angle: _this.angle
          });
          fabricImg.on('moving', function(){
            _this.left = fabricImg.get('left');
            _this.top = fabricImg.get('top');
          });
          fabricImg.on('scaling', function(){
            _this.left = fabricImg.get('left');
            _this.top = fabricImg.get('top');
            _this.width = fabricImg.getWidth();
            _this.height = fabricImg.getHeight();
          });
          _this.fabricImg = fabricImg;
          _this.canvas.add(fabricImg);
        });
        
      }
      
    });
    
  });
  
};

Frame.prototype.rotateImage = function(direction) {
//  this.fabricImg.remove();
  var _this = this;
  if(direction===undefined) {
    direction = 1;
  }
  rotate(this.src, direction, function(image){
    _this.setImage(image);
  });
 
};

$(document).ready(function(){
  var canvas = new fabric.Canvas('c');
  fabric.Object.prototype.transparentCorners = false;
  fabric.Object.prototype.rotatingPointOffset = 25;
  
  window.frame = new Frame(canvas, 10, 10, 100, 150, 30);
  window.frame.setImage('./images/girl.jpg');
  
  
  /* var text = new fabric.Text('中文', { 
    left: 200, 
    top: 200,
    fontSize: 20,
    lockUniScaling: true
  });
  canvas.add(text); */
  
//  fabric.Image.fromURL('./images/girl.jpg', function(oImg) {
//    oImg.scale(0.2).set({
//      left: 20, 
//      top: 20
//    });
//    canvas.add(oImg);
//  });
  
//  var mask1;
//  
//  var ready = function() {
//    fabric.Image.fromURL('./images/f2.jpg', function(img) {
//       img.scale(0.5).set({
//         left: 20, 
//         top: 20
//       });
//      
//      img.filters.push( new fabric.Image.filters.Mask( { 'mask': mask1 } ) );
//      img.applyFilters(function() {
//        canvas.add(img);
//        canvas.renderAll();
//      });
//
//    });
//  };
//  
//  
//  new fabric.Image.fromURL( './images/mask1.jpg' , function( img ){
//    mask1 = img;
//    ready();
//  });
  
  
  
});