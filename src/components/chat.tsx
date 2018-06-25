import * as React from 'react';
import LeftTree from "./left-tree";
import ChatMessages from "./chat-messages";
import MessageTextarea from "./message-textarea";
import './chat.css';
import {ERROR_MSG} from "../App";
import {stateStoreService} from "../state/state-store";
import {IMessage} from "../models/message";
import {Message} from '../models/message';
import {listItem} from './left-tree';
import * as io from 'socket.io-client';

const socket =io();

interface IChatProps {
    data:{
        loggedInUser: {name:string, id:string} | null,
        errorMsg: ERROR_MSG,
        counter: number,
        redirect:boolean
    },
    tree:listItem[]
}

interface IChatState {
    selectedName? : string,
    selectedId?:string,
    selectedType?:string,
    message:IMessage,
    selectedMassages?:IMessage[],
}

class Chat extends React.Component<IChatProps, IChatState> {
    constructor(props:IChatProps) {
        super(props);
            this.state = {message:{message:''}};
    }

    public logOut = () => {
        this.setState({selectedId:"", selectedType:"", selectedName:""})
    };

    public getSelectedConversationMessagesHistory = (eventTarget:any) => {
        if(this.props.data.loggedInUser) {
            if (eventTarget.tagName !== 'UL' && eventTarget.tagName !== 'LI') {
                // if(eventTarget.type === 'group'){
                //     if(stateStoreService.isUserExistInGroup(eventTarget.id, this.props.data.loggedInUser.id)){
                //         this.setStateOnSelected(eventTarget);
                //     }
                // }
                // else{
                //     this.setStateOnSelected(eventTarget);
                // } // fixme להציג למשתמש את היסטוריית ההודעות רק כשהוא שייך לקבוצה....
                this.setStateOnSelected(eventTarget);
            }
        }
        else{
            alert("You need to login first...")
        }
    };

    private setStateOnSelected = (eventTarget:any) => {
        this.setState({
            selectedName: eventTarget.innerHTML.substr(1),
            selectedId: eventTarget.id,
            selectedType:eventTarget.type
        }, () => {
            this.getSelectedMessageHistory();
        });
    };
    // fixme כשמשתמש לוחץ על קבוצה הוא צריך לעזוב את הסשן הקודם..
    leaveGroup = () => {
        socket.emit('leave-group', this.state.selectedId);
    };

    private getSelectedMessageHistory = async() => {
        if(this.state.selectedId && this.props.data.loggedInUser){
            const messagesList:any = await stateStoreService.getSelectedMessagesHistory(this.state.selectedType, this.state.selectedId, this.props.data.loggedInUser.id);
            socket.emit('join-group', this.props.data.loggedInUser.name, this.state.selectedId);
            this.setState({selectedMassages:messagesList, message:{message:""}});
        }
    };

    public handleChange = (event: any):void => {
        this.setState({message : {message: event.target.value}});
    };

    public keyDownListener = (event:any) => {
        if(this.props.data.loggedInUser && this.state.selectedName && this.state.message.message.trimLeft().length){
            if(event.keyCode == 10 || event.keyCode == 13){
                event.preventDefault();
                this.addMessage();
            }
        }
    };

    public onClickSend = (event:React.MouseEvent<HTMLButtonElement>) => {
        if(this.props.data.loggedInUser && this.state.selectedName){
            this.addMessage();
        }
    };

    componentDidMount(){
        socket.on('msg', (msg:IMessage)=>{
            debugger;
            this.setState((prevState)=>{
                return {
                    selectedMassages: [
                        ...prevState.selectedMassages, msg
                    ]
                }
            })
        });

        socket.on('connections', (username:string)=>{
            console.log(username+ " logged in");
        })
    }

    public addMessage = ()=>{
        this.setState({message : new Message(this.state.message.message, new Date().toLocaleString().slice(0, -3), this.props.data.loggedInUser)}, async()=>{
            socket.emit('msg', this.state.message, this.state.selectedId);
            await stateStoreService.addMessage(this.state.selectedType, this.state.selectedId, this.state.message, this.props.data.loggedInUser);
            this.setState((prevState)=>{
                return{
                    selectedMassages:[
                        ...prevState.selectedMassages, this.state.message
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
                    <div className="massages">
                        <ChatMessages loggedInUser={this.props.data.loggedInUser} selectedName={this.state.selectedName}
                                      messages={this.state.selectedMassages}/>
                    </div>
                    <div className="massage-text-area">
                        <MessageTextarea onClickSend={this.onClickSend} message={this.state.message}
                                         selectedName={this.state.selectedName} data={this.props.data}
                                         handleChange={this.handleChange} keyDownListener={this.keyDownListener}/>
                    </div>
                </div>
            </div>
        );
    }
}

export default Chat;