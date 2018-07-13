import * as React from 'react';
import LeftTree from "./left-tree";
import ChatMessages from "./chat-messages";
import MessageTextarea from "./message-textarea";
import './chat.css';
import {IMessage} from "../models/message";
import {Message} from '../models/message';
import {listItem} from './left-tree';
import {socket} from '../App';
import {addMessageToConversation, getSelectedMessagesHistory} from "../state/actions";
import {connect} from "react-redux";
import {getGroups, treeSelectors} from "../selectors/selectors";
import {IClientGroup} from "../interfaces";

interface IChatProps {
    tree:listItem[],
    groups:IClientGroup[],
    onAddMessage(selectedType:string,selectedId:string, message:IMessage, loggedInUser:{name:string, _id:string}):void,
    onSelectConversation(selectedId:string):Promise<void>,
    selectedMessages:IMessage[],
    loggedInUser:{name:string, _id:string}
}

interface IChatState {
    selectedName? : string,
    selectedId?:string,
    selectedType?:string,
    message:IMessage,
    selectedMessages:IMessage[],
    previousSelectedId?:string,
    previousSelectedType?:string,
    isAllowedToJoinTheGroup : boolean
}

class Chat extends React.Component<IChatProps, IChatState> {
    public messagesRef:any;

    constructor(props:IChatProps) {
        super(props);
            this.state = {
                message:{message:''},
                isAllowedToJoinTheGroup:false,
                selectedMessages:this.props.selectedMessages
            };
        this.messagesRef = React.createRef();
    }

    componentDidUpdate(){
        this.messagesRef.current.scrollTop = 9999999;
    }

    public onUserLogOut = () => {
        debugger;
        this.setState({selectedId:"", selectedType:"", selectedName:""});
    };

    public getSelectedConversationMessagesHistory = (eventTarget:any) => {
        debugger;
        if (eventTarget.tagName !== 'UL' && eventTarget.tagName !== 'LI' && this.props.loggedInUser) {
            this.setStateOnSelected(eventTarget);
        }
    };

    private setStateOnSelected = (eventTarget:any) => {
        debugger;
        let previousSelectedId;
        const previousSelectedType = this.state.selectedType;
        if(previousSelectedType === "user"){
            previousSelectedId = [this.state.selectedId, this.props.loggedInUser._id].sort().join("_");
        }
        else{
            previousSelectedId = this.state.selectedId;
        }
        this.setState({
            selectedName: eventTarget.innerHTML.substr(1),
            selectedId: eventTarget.id,
            selectedType:eventTarget.type,
            previousSelectedType,
            previousSelectedId
        }, () => {
            this.getSelectedMessageHistory();
        });
    };

    static getDerivedStateFromProps(nextProps:IChatProps, prevState:IChatState) {
        if (prevState.selectedMessages !== nextProps.selectedMessages) {
            return {
                selectedMessages: nextProps.selectedMessages,
            };
        }
        return null;
    }

    private getSelectedMessageHistory = async() => {
        if(this.state.selectedId && this.props.loggedInUser){
            let selectedId;
            const loggedInUserName = this.props.loggedInUser.name;
            const loggedInUserId = this.props.loggedInUser._id;
            if(this.state.previousSelectedId){
                socket.emit('leave-group', loggedInUserName, this.state.previousSelectedId);
            }
            if(this.state.selectedType === 'user'){
                selectedId = [this.state.selectedId , loggedInUserId].sort().join('_');
                socket.emit('join-group', loggedInUserName, selectedId);
                this.getSelectedMessages(selectedId);
            }
            else{
                selectedId = this.state.selectedId;
                if(this.isUserExistInGroup(selectedId, loggedInUserId)){
                    socket.emit('join-group', loggedInUserName, selectedId);
                    this.getSelectedMessages(selectedId);
                }
                else{
                    this.setState({isAllowedToJoinTheGroup:false});
                }
            }
        }
    };

    public isUserExistInGroup(selectedId:string, loggedInUserId:string){
        const selectedGroup = this.props.groups.find((group)=>{
            return group._id === selectedId;
        });
        if(selectedGroup.children) {
            const userIndex = selectedGroup.children.findIndex((item: any) => {
                return item._id === loggedInUserId;
            });
            return (userIndex !== -1);
        }
        else{
            return false;
        }
    }


    private getSelectedMessages = async(selectedId:string)=>{
        await this.props.onSelectConversation(selectedId);
        this.setState({message:{message:""}, isAllowedToJoinTheGroup:true});
    };

    public handleChange = (event: any):void => {
        this.setState({message : {message: event.target.value}});
    };

    public keyDownListener = (event:any) => {
        if(this.props.loggedInUser && this.state.selectedName && this.state.message.message.trimLeft().length){
            if(event.keyCode == 10 || event.keyCode == 13){
                event.preventDefault();
                this.addMessage();
            }
        }
    };

    public onClickSend = (event:React.MouseEvent<HTMLButtonElement>) => {
        debugger;
        if(this.props.loggedInUser && this.state.selectedName){
            this.addMessage();
        }
    };

    componentDidMount(){
        socket.on('msg', (msg:IMessage)=>{
            this.setState((prevState)=>{
                return {
                    selectedMessages: [
                        ...prevState.selectedMessages, msg
                    ]
                }
            })
        });

        socket.on('connections', (username:string)=>{
            console.log(username+ " logged in");
        })
    }

    public addMessage = ()=>{
        this.setState({message : new Message(this.state.message.message, new Date(), this.props.loggedInUser)}, async()=>{
            let conversationId;
            debugger;
            if(this.state.selectedType === "User"){
                conversationId = [this.props.loggedInUser._id, this.state.selectedId].sort().join("_");
            }
            else{
                conversationId = this.state.selectedId;
            }
            socket.emit('msg', conversationId, this.state.message);
            await this.props.onAddMessage(this.state.selectedType, this.state.selectedId, this.state.message, this.props.loggedInUser);
            this.setState((prevState)=>{
                return{
                    selectedMessages:[
                        ...prevState.selectedMessages, this.state.message
                    ],
                    message:{message:""}
                }
            })
        });
    };

    public render() {
        return (
            <div className="chat">
                <div className="chat-left">
                    <LeftTree tree={this.props.tree} getSelected={this.getSelectedConversationMessagesHistory}/>
                </div>
                <div className="chat-right">
                    <div ref={this.messagesRef} className="massages">
                        <ChatMessages loggedInUser={this.props.loggedInUser} selectedName={this.state.selectedName}
                                      messages={this.state.selectedMessages}/>
                    </div>
                    <div className="massage-text-area">
                        <MessageTextarea onClickSend={this.onClickSend} message={this.state.message}
                                         selectedName={this.state.selectedName} loggedInUser={this.props.loggedInUser}
                                         handleChange={this.handleChange} keyDownListener={this.keyDownListener}
                                         isAllowedToJoinTheGroup={this.state.isAllowedToJoinTheGroup}/>
                    </div>
                </div>
            </div>
        );
    }
}


const mapStateToProps = (state:any, ownProps:any) => {
    return {
        tree: treeSelectors(state),
        selectedMessages : state.selectedMessages,
        loggedInUser : state.loggedInUser,
        groups: getGroups(state)
    }
};

const mapDispatchToProps = (dispatch:any, ownProps:any) => {
    return {
        onAddMessage: (selectedType:string, selectedId:string, msg:IMessage, loggedInUser:{name:string, _id:string}) => {
            dispatch(addMessageToConversation(selectedType, selectedId, msg, loggedInUser))
        },
        onSelectConversation:(selectedId:string)=>{
            dispatch(getSelectedMessagesHistory(selectedId));
        }
    }
};

export default connect(
    mapStateToProps,
    mapDispatchToProps)(Chat);