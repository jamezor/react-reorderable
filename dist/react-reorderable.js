(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['React'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('React'));
  } else {
    root.ReactReorderable = factory(root.React);
  }
}(this, function(React) {
function getClosestReorderable(el) {
  while (el) {
    if (el.className &&
        el.className.indexOf('react-reorderable-item') >= 0) {
      return el;
    }
    el = el.parentNode;
  }
  return null;
}

function getNextNode(node) {
  var p = node.parentNode;
  var siblings = p.children;
  var current;
  var minDistance = Infinity;
  var next = null;
  var offsetTop = node.offsetTop;
  for (var i = 0; i < siblings.length; i += 1) {
    current = siblings[i];
    if (current.getAttribute('data-reorderable-key') !==
        node.getAttribute('data-reorderable-key')) {
      var diff = current.offsetTop - offsetTop;
      if (diff > 0 && diff < minDistance) {
        minDistance = diff;
        next = current;
      }
    }
  }
  return next;
}

function indexChildren(children) {
  var prefix = 'node-';
  var map = {};
  var ids = [];
  for (var i = 0; i < children.length; i += 1) {
    id = prefix + (i + 1);
    ids.push(id);
    children[i] =
      React.createElement("div", {className: "react-reorderable-item", 
        key: id, "data-reorderable-key": id}, 
        children[i]
      );
    map[id] = children[i];
  }
  return { map: map, ids: ids };
}

var ReactReorderable = React.createClass({displayName: "ReactReorderable",
  componentWillMount: function () {
    var res = indexChildren(this.props.children);
    this.setState({
      order: res.ids,
      reorderableMap: res.map
    });
  },
  componentWillReceiveProps: function (nextProps) {
    if (nextProps.children) {
      var res = indexChildren(this.props.children);
      this.setState({
        order: res.ids,
        reorderableMap: res.map
      });
    }
  },
  getInitialState: function () {
    return { order: [], startPosition: null, activeItem: null, reorderableMap: {} };
  },
  onDragStop: function (e) {
    this.setState({
      activeItem: null,
      startPosition: null
    });
  },
  onDrag: function (e) {
    var handle = this.refs.handle.getDOMNode();
    var nextNode = getNextNode(handle);
    var currentKey = handle.getAttribute('data-reorderable-key');
    var order = this.state.order;

    var currentPos = order.indexOf(currentKey);
    order.splice(currentPos, 1);

    var nextKey = null;
    var nextPos = order.length;
    if (nextNode) {
      nextKey = nextNode.getAttribute('data-reorderable-key');
      nextPos = order.indexOf(nextKey);
    }

    order.splice(nextPos, 0, currentKey);
    this.setState({
      order: order
    });
  },
  onMouseDown: function (e) {
    this.setState({
      mouseDownPosition: {
        x: e.clientX,
        y: e.clientY
      }
    });
  },
  onMouseMove: function (e) {
    if (!this.state.activeItem) {
      var initial = this.state.mouseDownPosition;
      // Still not clicked
      if (!initial) {
        return;
      }
      if (Math.abs(e.clientX - initial.x) >= 5 ||
          Math.abs(e.clientY - initial.y) >= 5) {
        var node = getClosestReorderable(e.target);
        var nativeEvent = e.nativeEvent;
        this.activeItem = node;
        this.setState({
          mouseDownPosition: null,
          activeItem: node.getAttribute('data-reorderable-key'),
          startPosition: {
            x: node.offsetLeft,
            y: node.offsetTop
          }
        }, function () {
          // React resets the event's properties
          this.refs.handle.handleDragStart(nativeEvent);
        }.bind(this));
      }
    }
  },
  render: function () {
    var children = this.state.order.map(function (id) {
      var className = '';
      if (this.state.activeItem === id) {
        className += 'react-reorderable-item-active';
      }
      return React.addons.cloneWithProps(
        this.state.reorderableMap[id], {
          onMouseDown: this.onMouseDown,
          onMouseMove: this.onMouseMove,
          className: className
      });
    }, this);
    var handle;
    if (this.state.activeItem) {
      var pos = this.state.startPosition;
      handle = React.addons.cloneWithProps(
        this.state.reorderableMap[this.state.activeItem], {
          className: 'react-reorderable-handle'
      });
      handle =
        React.createElement(ReactDrag, {onStop: this.onDragStop, 
          onDrag: this.onDrag, 
          ref: "handle", 
          start: { x: pos.x, y: pos.y}}, 
          handle
        );
    }
    return (
      React.createElement("div", {ref: "wrapper"}, 
        children, 
        handle
      )
    );
  }
});

return ReactReorderable;
}));
