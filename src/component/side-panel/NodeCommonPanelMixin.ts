import {Component, Vue} from "vue-property-decorator";

@Component
export default class NodeCommonPanelMixin extends Vue {
    protected getClassesColors(classList: string[]): {label: string; color: string}[] {
        if (!classList) return null;

        let colors = ['red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue', 'light-blue', 'green', 'light-green', 'lime', 'yellow', 'amber', 'orange', 'deep-orange'];

        return classList.map(cls => {
            return {
                label: cls,
                color: colors[Math.abs(cls.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)) % colors.length]
            }
        });
    }
}
