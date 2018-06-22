export async function getUsers():Promise<any>{
    return await get('/users');
}

export async function saveUserDetails(user:{name:string, age?:number, password?:string, id:string}):Promise<any>{
    return await patch(`/users/${user.id}`, user);
}

export async function deleteUser(user:{name:string, age:number, id:string}):Promise<void>{
    return await remove(`/users/${user.id}`);
}

export async function deleteGroup(group:{id:string, name:string}):Promise<void>{
    return await remove(`groups/${group.id}`);
}

export async function createNewUser(user:{name:string, age?:number, password:string}):Promise<{user:{name:string, age:string, id:string}}>{
    return await post('/users', user);
}

export async function createNewGroup(group:{name:string, parent:string}) {
    return await post('/groups', group);
}

export async function getGroups():Promise<{data :{name:string, id:string}[]}>{
   return await get('/groups');
}

export async function getGroupData(groupId:string):Promise<any>{
    return await get(`/groups/${groupId}`)
}

export async function getGroupsWithGroupsChildren():Promise<{data :{name:string, id:string}[]}>{
    return await get('/groups?groups_with_children=true')
}

function post(url:string, body:any){
    return fetch(url,{
        method:'POST',
        body:JSON.stringify(body),
        headers:{'content-type': 'application/json'}
    })
        .then((res)=>{
            return res.json();
        })
}

function patch(url:string, body:any){
    return fetch(url, {
        method:'PATCH',
        body:JSON.stringify(body),
        headers:{'content-type': 'application/json'}
    })
        .then((res)=>{
            return res.json();
        })
}

function get(url:string){
    return fetch(url)
        .then((res)=>{
            return (res.json());
        })
}

function remove(url:string){
    return fetch(url, {
        method:'DELETE'
    })
        .then(()=>{
            return;
        })
}
