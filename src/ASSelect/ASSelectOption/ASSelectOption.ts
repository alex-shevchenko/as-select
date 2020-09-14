import html from './ASSelectOption.html';
import css from './ASSelectOption.scss';

import ASComponentBase from "../../ASComponentBase";

const template = ASComponentBase.prepareTemplate(html, css);

export default class ASSelectOption extends ASComponentBase {
    private shadow: ShadowRoot;
    private el: HTMLElement;

    constructor() {
        super();

        this.shadow = this.attachShadow({mode: 'closed'});
        this.shadow.appendChild(template.content.cloneNode(true));
        this.el = this.shadow.getElementById('content') as HTMLElement;
    }

    connectedCallback(): void {
        this.setAttributeIfNotSetByAuthor('role', 'option');
    }

    get value(): string | null {
        return this.getAttribute('value');
    }
    set value(val: string | null) {
        this.setAttributeValue('value', val);
    }

    private _selected = false;
    get selected(): boolean { return this._selected; }
    set selected(val: boolean) {
        this._selected = val;
        this.setClass('selected', val);
    }

    private _active = false;
    get active(): boolean { return this._active }
    set active(val: boolean) {
        this._active = val;
        this.setClass('active', val);
    }

    private _filtered = false;
    get filtered(): boolean { return this._filtered }
    set filtered(val: boolean) {
        this._filtered = val;
        this.setClass('filtered', val);
    }

    private setClass(name: string, val: boolean): void {
        if (val) {
            this.el.classList.add(name);
            this.el.part.add(name);
        } else {
            this.el.classList.remove(name);
            this.el.part.remove(name);
        }
    }

    index: number;
}

