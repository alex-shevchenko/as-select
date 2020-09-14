const expect = chai.expect;

function openShadow() {
  HTMLElement.prototype._attachShadow = HTMLElement.prototype.attachShadow;
  HTMLElement.prototype.attachShadow = function (...args) {
    if (args.length > 0) {
      args[0]['mode'] = 'open';
    }
    return this._attachShadow.apply(this, args);
  };
}
function restoreShadow() {
  if (HTMLElement.prototype._attachShadow) {
    HTMLElement.prototype.attachShadow = HTMLElement.prototype._attachShadow;
    HTMLElement.prototype._attachShadow = undefined;
  }
}

function createContainer(el) {
  this.container = document.createElement(el ? el : 'div');
  document.body.appendChild(this.container);
}
function removeContainer() {
  this.container.remove();
  this.container = null;
}
function createCustomElement(name) {
  return function() {
    this.container.innerHTML=`<${name}></${name}>`;
    return customElements.whenDefined(name).then(() => this.element = this.container.querySelector(name));
  }
}
function removeCustomElement() {
  this.element.remove();
  this.element = null;
}

function checkAtttribute(el, name, value) {
  if (value === null) {
    expect(el.hasAttribute(name)).to.equal(false);
  } else if (typeof value == 'string') {
    expect(el.getAttribute(name)).to.equal(value);
  } else if (typeof value == 'boolean') {
    expect(el.hasAttribute(name)).to.equal(value);
  }
}

function attributePropertyTest(name, testValue, defaultValue = null, additionalDescription = undefined, additionalCheck = undefined) {
  return function() {
    it(`should change .${name} when setting [${name}]` + (additionalDescription ? ' '  + additionalDescription : ''), function () {
      expect(this.element[name]).to.be.equal(defaultValue);
      if (additionalCheck) additionalCheck.call(this, name, defaultValue);

      this.element.setAttribute(name, testValue);
      expect(this.element[name]).to.be.equal(testValue);
      if (additionalCheck) additionalCheck.call(this, name, testValue);

      this.element.removeAttribute(name);
      expect(this.element[name]).to.be.equal(defaultValue);
      if (additionalCheck) additionalCheck.call(this, name, defaultValue);
    });
    it(`should change [${name}] when setting .${name}` + (additionalDescription ? ' '  + additionalDescription : ''), function () {
      checkAtttribute(this.element, name, defaultValue);
      if (additionalCheck) additionalCheck.call(this, name, defaultValue);

      this.element[name] = testValue;
      expect(this.element[name]).to.be.equal(testValue);
      checkAtttribute(this.element, name, testValue);
      if (additionalCheck) additionalCheck.call(this, name, testValue);

      this.element[name] = null;
      expect(this.element[name]).to.be.equal(defaultValue);
      checkAtttribute(this.element, name, defaultValue);
      if (additionalCheck) additionalCheck.call(this, name, defaultValue);
    });
  }
}

function booleanPropertyTest(name, defaultValue = false, additionalDescription = undefined, additionalCheck = undefined) {
  return function() {
    it(`.${name} should change properly` + (additionalDescription ? ' '  + additionalDescription : ''), function () {
      expect(this.element[name]).to.be.equal(defaultValue);
      if (additionalCheck) additionalCheck.call(this, name, defaultValue);

      this.element[name] = !defaultValue;
      expect(this.element[name]).to.be.equal(!defaultValue);
      if (additionalCheck) additionalCheck.call(this, name, !defaultValue);

      this.element[name] = defaultValue;
      expect(this.element[name]).to.be.equal(defaultValue);
      if (additionalCheck) additionalCheck.call(this, name, defaultValue);
    });
  }
}

async function tick() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 0);
  });
}
async function simulateKeyboardEvent(el, key) {
  return new Promise((resolve) => {
    const down = new KeyboardEvent('keydown', {key: key});
    el.dispatchEvent(down);

    const up = new KeyboardEvent('keyup', {key: key});

    setTimeout(() => el.dispatchEvent(up), 20);
    setTimeout(() => resolve(), 30);
  });
}
