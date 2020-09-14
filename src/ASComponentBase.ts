/* eslint-disable @typescript-eslint/no-explicit-any */
export default class ASComponentBase extends HTMLElement {
    static readonly STYLESHEET_ID_POSTFIX = '-stylesheet';

    static prepareTemplate(html: string, css?: string): HTMLTemplateElement {
        if (css) {
            html = '<style>' + css + '</style>' + html;
        }
        const template = document.createElement('template');
        template.innerHTML = html;
        return template;
    }
    static removeStylesheet(name: string): void {
        customElements.whenDefined(name).then(() => {
            const styleEl = document.getElementById(name + ASComponentBase.STYLESHEET_ID_POSTFIX);
            styleEl?.parentElement?.removeChild(styleEl);
        });
    }

    private customAttributes: {[attrName: string]: boolean} = {};

    constructor() {
        super();
    }

    protected setAttributeIfNotSetByAuthor(name: string, value: boolean | string | number | null | undefined): void {
        if (this.customAttributes[name] || !this.hasAttribute(name)) {
            this.setAttributeValue(name, value);
            this.customAttributes[name] = true;
        }
    }

    protected upgradeProperty(prop: string): void {
        if (Object.prototype.hasOwnProperty.call(this, prop)) {
            const value = (this as any)[prop];
            delete (this as any)[prop];
            (this as any)[prop] = value;
        }
    }

    protected setAttributeValue(name: string, value: boolean | string | number | null | undefined): void {
        if (typeof value == 'boolean') {
            if (value) this.setAttribute(name, '');
            else this.removeAttribute(name);
        } else if (typeof value == 'string') {
            this.setAttribute(name, value);
        } else if (typeof value == 'number') {
            this.setAttribute(name, value.toString());
        } else {
            this.removeAttribute(name);
        }
    }
}
