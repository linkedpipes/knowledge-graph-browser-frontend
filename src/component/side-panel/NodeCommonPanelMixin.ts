import {Component, Vue} from "vue-property-decorator";
@Component
export default class NodeCommonPanelMixin extends Vue {
    protected getClassesColors(classList: string[]): {label: string; color: string}[] {
        if (!classList) return null;

        let colors = ['#E9967A', 'pink', '#b8b58a', '#FFF8DC', '#D2691E', 'blue', 'light-blue', 'green', 'light-green', 'lime', 'yellow', 'amber', 'orange', 'deep-orange'];
                
        return classList.map(cls => {
            return {
                label: cls,
                color: colors[Math.abs(cls.split("").reduce(function(a,b){a=((a<<9)-a)+b.charCodeAt(0);return a&a},0)) % colors.length]
            }
        });
    }
}
