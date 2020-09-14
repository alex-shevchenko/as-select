import ASSelectOption from "./ASSelect/ASSelectOption/ASSelectOption";
import ASSelect from "./ASSelect/ASSelect";

if (!window.customElements.get('as-select')) {
    customElements.define('as-option', ASSelectOption);
    customElements.define('as-select', ASSelect);

    ASSelect.removeStylesheet('as-select');
}

export { ASSelect, ASSelectOption }
