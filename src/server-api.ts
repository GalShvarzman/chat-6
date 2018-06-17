import IUser from './models/user';

export function getUsers():Promise<any>{
    return fetch('/users')
        .then((res)=>{
            return (res.json());
        })
}

export function saveUserDetails(user:IUser):Promise<any>{
    return fetch(`/users/${user.id}/edit`, {
        method:'PUT',
        body:JSON.stringify(user),
        headers:{'content-type': 'application/json'}
    })
        .then((res)=>{
            return res.json();
        })
}