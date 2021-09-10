// 导入库
import { 
App, 
Modal, 
Notice, 
Plugin, 
PluginManifest,
PluginSettingTab, 
Setting,
ItemView, View,
Workspace,
WorkspaceLeaf,
} from 'obsidian';
// import TaskManageList from "./components/TaskManageList.svelte";



const VIEW_TYPE = "task-list";
// 接口
interface TaskManageSettings {
	mySetting: string;
	takspath: string;
}

// 插件默认设置
const DEFAULT_SETTINGS: TaskManageSettings = {
	mySetting: 'default',
	takspath: "TaskManage",
}

// 插件主要功能
export default class TaskManagePlugin extends Plugin {
	settings: TaskManageSettings;
	private viewProxy: TaskManageListItemViewProxy;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		// const leaf = this.app.workspace.get
		this.viewProxy = new TaskManageListItemViewProxy(app.workspace)
	}

	async onload() { // 插件重载
		console.log('loading plugin'); // 打印插件加载信息

		await this.loadSettings();  // 导入配置

		// 界面---左边的按钮
		this.addRibbonIcon('dice', 'Sample Plugin', () => {
			new Notice('This is a notice!');
		});
		
		// 界面---状态栏
		this.addStatusBarItem().setText('Status Bar Text'); // 设置状态栏文本

		// 界面---命令列表
		this.addCommand({  // 命令列表里面添加一个命令
			id: 'open-sample-modal',
			name: 'Open Sample Modal', // 命令的名字
			callback: () => {
			 	console.log('Simple Callback');
			},
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						new TaskManageModal(this.app).open(); // 命令的实现类
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({  // 命令列表里面添加一个命令
			id: 'test-task',
			name: 'Test Task', // 命令的名字
			checkCallback: (checking: boolean) => {
				if (!checking) {
				  this.showReminderList();
				}
				return true;
			},
		});


		// 界面---设置界面
		this.addSettingTab(new TaskManageSettingTab(this.app, this)); 

		// 编辑界面
		this.registerCodeMirror((cm: CodeMirror.Editor) => {
			console.log('codemirror', cm);
		});

		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {  // 注册点击事件
			console.log('click', evt);
		});

		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000)); // 设置时间间隔  定时任务
		
		
		// this.registerView("债务列表", (leaf : WorkspaceLeaf) => {return new TaskManageListItemView(leaf);})
		this.registerView("task-list", (leaf: WorkspaceLeaf) => {
			return this.viewProxy.createView(leaf);
		  });
		

		// 界面---打开通知界面
		if (this.app.workspace.layoutReady) {
			this.viewProxy.openView();
		} else {
			(this.app.workspace as any).on("layout-ready", () => {
				this.viewProxy.openView();
			});
		}

		this.watchVault();
	}
	
	// 通知---文件更改通知
	private watchVault() {
		console.log("file change")	
	}

	showReminderList(): void {
		if (this.app.workspace.getLeavesOfType("taskmanage").length) {
		  return;
		}
		this.app.workspace.getRightLeaf(false).setViewState({
		  type: "taskmanage",
		});
	}

	onunload() { // 卸载插件
		console.log('unloading plugin');
	}


	// 导入配置
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	// 保存配置
	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// 实用的命令
class TaskManageModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	// 打开的程序
	onOpen() { 
		let {contentEl} = this;
		
		this.app.workspace.getRightLeaf(true).setViewState({
			type: 'my-view-type',
		  });
		contentEl.setText('Woah888!'); // 出来的一个窗口
		console.log("www--:", this.containerEl)
	}

	// 关闭的程序
	onClose() { 
		let {contentEl} = this;
		contentEl.empty();
	}
}

// 插件的设置界面类
class TaskManageSettingTab extends PluginSettingTab {

	plugin: TaskManagePlugin;

	constructor(app: App, plugin: TaskManagePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}


	// 界面配置
	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		// 界面的名称
		containerEl.createEl('h2', {text: '插件设置'});

		this.plugin.settings.takspath
		// 一个配置项
		new Setting(containerEl)
			.setName('任务目录') // 设置名称
			.setDesc('任务文件存放的目录') // 设置说明
			.addText(text => text
				.setPlaceholder('选择想要设置的目录')
				.setValue(this.plugin.settings.takspath)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.takspath = value; //保存设置到变量
					await this.plugin.saveSettings(); //保存设置到文件
				}));
	}
}



// 任务列表显示窗口
class TaskManageListItemView extends ItemView {
	// private view: TaskManageList;

	constructor(
		leaf: WorkspaceLeaf,
	) {
	super(leaf);

	}
	

	getViewType(): string {
		return "任务列表";
	}
	getDisplayText(): string {
		return "Smile";
	}
	getIcon(): string {
		return "clock";
	}

	async onOpen(): Promise<void> {
		console.log("reminder", "67", "listview open")
		this.contentEl.appendText("hello")
	}

	reload() {
		console.log("reminder", "67", "listview reload")
		this.contentEl.appendText("hello reload")
	}

	onClose(): Promise<void> {
		console.log("reminder", "67", "listview close")
		return 
	}
}

class TaskManageListItemViewProxy {
	constructor(
		private workspace: Workspace
	  ) { }

	createView(leaf: WorkspaceLeaf): View {
		return new TaskManageListItemView(
			leaf
		);
	}

	openView(): void {
		if (this.workspace.getLeavesOfType(VIEW_TYPE).length) {
		  // reminder list view is already in workspace
		  return;
		}
		// Create new view
		this.workspace.getRightLeaf(false).setViewState({
		  type: VIEW_TYPE,
		});
	  }

	reload(force: boolean = false) {
		const views = this.getViews();
	}
	private getViews() {
		return this.workspace
		  .getLeavesOfType("task-list")
		  .map(leaf => leaf.view as TaskManageListItemView);
	  }
}



