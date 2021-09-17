// 导入库
import { MarkdownDocument } from 'markdown';
import moment from "moment";
import { JsonObjectExpression } from 'typescript';
import { 
App, 
Modal, 
Vault,
TFile,
Notice, 
TAbstractFile,
Plugin, 
PluginManifest,
PluginSettingTab, 
Setting,
ItemView, View,
Workspace,
WorkspaceLeaf,
} from 'obsidian';


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
	private taskmanagelist : TaskManageList;
	private taskmanagecontrol: TaskManageController;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		// const leaf = this.app.workspace.get
		this.taskmanagelist = new TaskManageList();
		this.viewProxy = new TaskManageListItemViewProxy(app.workspace);
		this.taskmanagecontrol = new TaskManageController(app.vault, this.viewProxy);
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
				console.log(this.app.workspace.getRightLeaf(false))
				console.log(this.app.workspace.getLeftLeaf(false))
				console.log(this.app.workspace.getUnpinnedLeaf(VIEW_TYPE))
				console.log(this.app.workspace.getLeaf(false))  // 文本编辑区
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
			// console.log('click', evt);
		});

		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000)); // 设置时间间隔  定时任务
		
		
		// this.registerView("债务列表", (leaf : WorkspaceLeaf) => {return new TaskManageListItemView(leaf);})
		this.registerView(VIEW_TYPE, (leaf: WorkspaceLeaf) => {
			return this.viewProxy.createView(this.taskmanagelist, leaf);
		  });

		// this.app.workspace.getRightLeaf(false).setViewState({
			// type: VIEW_TYPE,
		//   });


		// 界面---打开通知界面
		if (this.app.workspace.layoutReady) {
			console.log("view", "115")
			this.viewProxy.openView();
		} else {
			(this.app.workspace as any).on("layout-ready", () => {
				this.viewProxy.openView();
			});
			console.log("view", "122")
		}

		this.watchVault();
	}
	
	// 通知---文件更改通知
	private watchVault() {
		[
			this.app.vault.on("modify", async (file) => {
			  this.taskmanagecontrol.reloadFile(file, true);
			}),
			this.app.vault.on("delete", (file) => {
			  this.taskmanagecontrol.removeFile(file.path);
			}),
			this.app.vault.on("rename", (file, oldPath) => {
			  this.taskmanagecontrol.removeFile(oldPath);
			  this.taskmanagecontrol.reloadFile(file);
			}),
		  ].forEach(eventRef => {
			this.registerEvent(eventRef);
		  })
	}

	showReminderList(): void {
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE).length) {
			console.log("view", "145")
		  return;
		}
		console.log("view", "148")
		this.app.workspace.getRightLeaf(false).setViewState({
		  type: VIEW_TYPE,
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
			type: VIEW_TYPE,
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

// 控制器模型
class TaskManageController{
	taskmanageview: TaskManageListItemViewProxy
	constructor(private vault: Vault, taskview: TaskManageListItemViewProxy) {
		this.taskmanageview = taskview
	 }

	async reloadFile(file: TAbstractFile, reloadUI: boolean = false) {
		console.log("reload file: path=%s");
		if (!(file instanceof TFile)) {
			console.debug("Cannot read file other than TFile: file=%o", file);
			return;
		  }
		  if (!this.isMarkdownFile(file)) {
			console.debug("Not a markdown file: file=%o", file);
			return;
		  }
		const content = new Content(file.path, await this.vault.cachedRead(file));
		content.getTaskManage()

		// 界面更新
		this.taskmanageview.reload()
		return content
	}
	async removeFile(path: string) {
		console.log("Remove file: path=%s", path);
	}
	async openFile(path: string) {
		console.log("open file: path=%s", path);
	}

	private isMarkdownFile(file: TFile) {
		return file.extension.toLowerCase() === "md";
	  }

}

// 开始时间: 2021-09-08
// 结束时间: 2021-10-08
// 重复间隔: 每天  每周一二三
// 完成记录:
// 进度: 3%
// 完成开始时间: 2021-09-08 16:24
// 完成结束时间: 2021-09-08 18:23
// 花费时间: 
// 任务备注: 开发ob的任务提醒插件 
// {
// 	"starttime": "2021-9-11 23:50",
// 	"endtime": "2021-9-11 23:50",
// 	"reparttime": "everyday",
// 	"progress": 2,
// 	"completerecord": [
// 	  {
// 		"start": "2021-9-11 23:56",
// 		"end": "2021-9-11 23:57"
// 	  },
// 	  {
// 		"start": "2021-9-11 23:56",
// 		"end": "2021-9-11 23:57"
// 	  }
// 	],
// 	"totaltime": "12.5",
// 	"note": "hello"
//   }
class Task {
	starttime: string
	endtime: string
	reparttime: string
	progress: number
	completerecord: []
	totaltime: string  // 总计时间
	note: string 	// 备注



}

class TaskParse {
	regexp : RegExp

	constructor() {
		this.regexp = new RegExp("(?<=##).*?(?=##)");
	 }


	public parse(data: string) {
		const result = this.regexp.exec(data)
		
		if (result) {
			console.log("pause", result.length)
			var sjson = JSON.parse(result[0])
			console.log(sjson)
		}
		

		return result
	}
}


class DateTime {
	now() {
		return moment().format('YYYY-MM-DD HH:mm:ss');
		// console.log(now)
	}
}

// 读取md文件的内容
class Content {
	private doc: MarkdownDocument;
	private taskparse: TaskParse;
	private tasklist: Array<string>;

	constructor(file: string, content: string) {
		this.doc = new MarkdownDocument(file, content);
		this.taskparse = new TaskParse();
	}

	public getTaskManage(){
		this.doc.getTodos().forEach(todo => {
			if (todo.checked) {
				return;
			}
			// 解析任务的字符串 --flag--
			// const parsed = parseReminder(this.doc.file, todo.lineIndex, todo.body);
			console.log("getTaskManage", todo.lineIndex, todo.checked, todo.body);
			var date = this.taskparse.parse(todo.body)
			
			console.log(date)
		})
	}

}

class TaskManageList {
	tasklist : Array<string>

	constructor() {
		this.tasklist = []
	}

	setlist() {

	}

	addlist (task: string) {
		this.tasklist.push(task)
	}

	getlist () {

	}

}

// 任务列表显示窗口
class TaskManageListItemView extends ItemView {
	private view: TaskManageList;

	constructor(
		tasklist : TaskManageList,
		leaf: WorkspaceLeaf,
	) {
	super(leaf);
		this.view = tasklist;
	}
	

	getViewType(): string {
		return VIEW_TYPE;
	}
	getDisplayText(): string {
		return VIEW_TYPE;
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
		// this.contentEl.appendText("hello reload\r\n")
		// this.containerEl.appendText("tain e1 \n")
		// this.containerEl.appendChild
		this.contentEl.setText("<main><div>   4543 </div></main>")
		// this.contentEl
	}

	onClose(): Promise<void> {
		console.log("reminder", "67", "listview close")
		return 
	}

	setText() {
		// this.contentEl.setText("")
		this.contentEl.appendText("1111")
		this.contentEl.appendText("222")
	}
}

class TaskManageListItemViewProxy {
	constructor(
		private workspace: Workspace
	  ) { }

	createView(tasklist:TaskManageList, leaf: WorkspaceLeaf): View {
		return new TaskManageListItemView(
			tasklist,
			leaf
		);
	}

	openView(): void {
		if (this.workspace.getLeavesOfType(VIEW_TYPE).length) {
		  // reminder list view is already in workspace
		//   console.log(this.workspace.getLeavesOfType(VIEW_TYPE))
		  return;
		}
		
		// Create new view
		this.workspace.getRightLeaf(false).setViewState({
		  type: VIEW_TYPE,
		});
	  }

	reload(force: boolean = false) {
		const views = this.getViews();
		views.forEach(view => view.reload())
		console.log("TaskManageListItemViewProxy", views)
		// console.log(this.workspace.getRightLeaf(false))
	}
	private getViews() {
		return this.workspace
		  .getLeavesOfType(VIEW_TYPE)
		  .map(leaf => leaf.view as TaskManageListItemView);
	}

}



