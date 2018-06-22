import * as React from 'react';
import {Switch, Route, Link, Redirect} from "react-router-dom";
import Login from "./components/login";
import './App.css';
import SignUp from "./components/sign-up";
import {stateStoreService} from "./state/state-store";
import Chat from "./components/chat";
import Menu from "./components/menu";
import UserAdmin from "./components/user-admin";
import UserEdit from "./components/user-edit";
import NewUser from "./components/new-user";
import GroupAdmin from "./components/group-admin";
import GroupEdit from "./components/group-edit";
import NewGroup from "./components/new-group";

export enum ERROR_MSG{
    none,
    allGood,
    credentials,
    locked
}

const changeOptions = {
    'users' : stateStoreService.getUsers.bind(stateStoreService),
    'groups' : stateStoreService.getGroups.bind(stateStoreService),
    'groupsWithGroupsChildren': stateStoreService.getGroupsWithGroupsChildren.bind(stateStoreService)
};

interface IAppState {
    loggedInUser: {name:string, id:string} | null,
    errorMsg: ERROR_MSG,
    counter: number,
    redirectToChat:boolean,
    users:{name:string, age:string, id:string}[],
    groups:{name:string, id:string}[],
    groupsWithGroupsChildren:{name:string, id:string}[],
    [key: string] : any
}

class App extends React.Component<{}, IAppState> {
    public chatMessagesChild:any;
    public menu:any;

    constructor(props:{}) {
        super(props);

        this.state = {
            loggedInUser: null,
            errorMsg: ERROR_MSG.none,
            counter: 0,
            redirectToChat:false,
            users: [],
            groups:[],
            groupsWithGroupsChildren:[]
        };

    }

    componentWillMount(){
        stateStoreService.subscribe(this.onSubscribe);
    }

    componentWillUnmount(){
        stateStoreService.unsubscribe(this.onSubscribe);
    };

    componentDidMount(){
        this.setState({users: stateStoreService.get('users'), groups: stateStoreService.get('groups'), groupsWithGroupsChildren:stateStoreService.get('groupsWithGroupsChildren')})
    }

    private onSubscribe = async (event:{changed:string[]}) => {
        if(event.changed){
            event.changed.forEach((change)=>{
                const result  = changeOptions[change]();
                this.setState({[change]:result});
            })
        }
    };

    public onEditUserDetails = async (user:{name:string, age?:number, password?:string, id:string}) => {
        await stateStoreService.saveUserDetails(user);
    };

    public onLoginSubmitHandler =(user:{name:string, password:string})=>{
        try{
            const userId = stateStoreService.auth(user);
            this.setState({
                loggedInUser: {name: user.name, id:userId},
                errorMsg: ERROR_MSG.allGood,
                redirectToChat: true
            })

        }
        catch(error){
            if(this.state.counter === 2){
                this.setState({
                    loggedInUser: null,
                    errorMsg: ERROR_MSG.locked
                });
            }
            else {
                this.setState((prev) => ({
                    loggedInUser: null,
                    errorMsg: ERROR_MSG.credentials,
                    counter: this.state.counter + 1
                }));
            }

        }

    };

    public onSignUpSubmitHandler = async (user:{name:string, age?:number, password:string}):Promise<void> => {
        try{
            const result = await stateStoreService.createNewUser(user);
            this.setState({loggedInUser:{name:result.user.name, id:result.user.id},redirectToChat:true});
        }
        catch(e){
            this.setState({errorMsg: ERROR_MSG.credentials})
        }
    };

    public loginRender = (props:any)=>(this.state.redirectToChat ? <Redirect to={{ pathname : '/chat'}} /> : <Login {...props} data={this.state} loginStatus={this.state.errorMsg} onSubmit={this.onLoginSubmitHandler}/>);

    public signUpRender = (props:any)=>(this.state.redirectToChat ? <Redirect to={{ pathname : '/chat'}}/> : <SignUp {...props} signUpStatus={this.state.errorMsg} onSubmit={this.onSignUpSubmitHandler}/>);

    public chatRender = (props:any) => (<Chat ref={instance => {this.chatMessagesChild = instance}} {...props} data={this.state}/>);

    public logOut = () => {
        this.setState({loggedInUser:null, redirectToChat:false, errorMsg: ERROR_MSG.none});
        this.chatMessagesChild.logOut();
    };

    public usersRender = () => (<UserAdmin deleteUser={this.deleteUser} refMenu={this.menu} users={this.state.users}/>);

    public groupsRender = () => (<GroupAdmin deleteGroup={this.deleteGroup} groups={this.state.groups}/>);

    public userEditRender = (props:any) => (<UserEdit onEditUserDetails={this.onEditUserDetails} {...props}/>);

    public  deleteUser = async(user:{name: string, age: number, id: string}):Promise<void> => {
        await stateStoreService.deleteUser(user);
    };

    public deleteGroup = async(group:{id:string, name:string}) => {
        await stateStoreService.deleteGroup(group);
        this.setState({groups: stateStoreService.getGroups()});
    };

    public newUserRender = (props:any) => (<NewUser {...props} onCreateNewUser={this.onCreateNewUser}/>);

    public newGroupRender = (props:any) => (<NewGroup {...props} onCreateNewGroup={this.onCreateNewGroup} groupsWithGroupsChildren={this.state.groupsWithGroupsChildren}/>);

    public groupEditRender = (props:any) => (<GroupEdit {...props}/>);

    public onCreateNewUser = async (user:{name:string, age:number, password:string})=> {
        return await stateStoreService.createNewUser(user);
    };

    public onCreateNewGroup = async (group:{name:string, parent:string})=>{
        return await stateStoreService.createNewGroup(group);
    };

    public render() {
        return (
            <div className="App">
                <Route path='/login' render={this.loginRender}/>
                <Route path='/sign-up' render={this.signUpRender}/>
                <nav>
                    <div className="nav-left">
                        <Link to="/"><button className="btn-home">Home</button></Link>
                        <Link to="/login"><button className="btn-login">login</button></Link>
                        <Link to="/sign-up"><button className="btn-sign-up">sign up</button></Link>
                        <Menu ref={instance => {this.menu = instance}}/>
                    </div>
                    <div className="nav-right">
                        <Link to="/chat"><button className="btn-log-out" onClick={this.logOut}>Log out</button></Link>
                    </div>
                    <div hidden={!this.state.loggedInUser} className='nav-right'>
                        <div className="app-logged-in">You are logged in as:
                            <span className='logged-in-name'>
                                {this.state.loggedInUser ? this.state.loggedInUser.name : ""}
                            </span>
                        </div>
                    </div>
                </nav>
                <div className="switch">
                    <Switch>
                        <Route exact={true} path='/chat' render={this.chatRender}/>
                        <Route exact={true} path='/' render={this.chatRender}/>
                        <Route exact={true} path='/users' render={this.usersRender}/>
                        <Route exact={true} path='/groups' render={this.groupsRender}/>
                        <Route exact={true} path='/groups/new' render={this.newGroupRender}/>
                        <Route exact={true} path='/groups/:id' render={this.newGroupRender}/>
                        <Route exact={true} path='/groups/:id/edit' render={this.groupEditRender}/>
                        <Route exact={true} path='/users/new' render={this.newUserRender}/>
                        <Route exact={true} path='/users/:id' render={this.newUserRender}/>
                        <Route exact={true} path='/users/:id/edit' render={this.userEditRender}/>
                    </Switch>
                </div>
            </div>
        );
    }
}

export default App;