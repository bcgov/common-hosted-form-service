declare const _default: {
    components: {
        orgbook: typeof import("./components/OrgBook/Orgbook").default;
        simplebtnreset: typeof import("./components/SimpleButtonReset/Component").default;
        simplebtnsubmit: typeof import("./components/SimpleButtonSubmit/Component").default;
        simplecheckbox: typeof import("./components/SimpleCheckbox/Component").default;
        simplecheckboxes: typeof import("./components/SimpleCheckboxes/Component").default;
        simplecols2: typeof import("./components/SimpleColumns2/Component").default;
        simplecols3: typeof import("./components/SimpleColumns3/Component").default;
        simplecols4: typeof import("./components/SimpleColumns4/Component").default;
        simplecontent: typeof import("./components/SimpleContent/Component").default;
        simpledatetime: typeof import("./components/SimpleDateTime/Component").default;
        simpleday: typeof import("./components/SimpleDay/Component").default;
        simpleemail: typeof import("./components/SimpleEmail/Component").default;
        simplefieldset: typeof import("./components/SimpleFieldSet/Component").default;
        simplefile: typeof import("./components/SimpleFile/Component").default;
        simpleheading: typeof import("./components/SimpleHeading/Component").default;
        simplenumber: typeof import("./components/SimpleNumber/Component").default;
        simplepanel: typeof import("./components/SimplePanel/Component").default;
        simpleparagraph: typeof import("./components/SimpleParagraph/Component").default;
        simplephonenumber: typeof import("./components/SimplePhoneNumber/Component").default;
        simpleradios: typeof import("./components/SimpleRadios/Component").default;
        simpleselect: typeof import("./components/SimpleSelect/Component").default;
        simpletabs: typeof import("./components/SimpleTabs/Component").default;
        simpletextarea: typeof import("./components/SimpleTextArea/Component").default;
        simpletextfield: typeof import("./components/SimpleTextField/Component").default;
        simpletime: typeof import("./components/SimpleTime/Component").default;
    };
    providers: {
        storage: {
            chefs: {
                (formio: any): {
                    title: string;
                    name: string;
                    uploadFile(file: any, name: any, dir: any, progressCallback: any, url: any, options: any, fileKey: any): any;
                    deleteFile(fileInfo: any, options: any): any;
                    downloadFile(file: any, options: any): any;
                };
                title: string;
            };
        };
    };
};
export default _default;
