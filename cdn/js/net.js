function get(url, params = {}) {
    return new Promise(resolve => {
        axios.get(url, { params }).then(res => {
            resolve(res.data);
        });
    });
}

function post(url, data) {
    return new Promise(resolve => {
        axios
            .post(url, JSON.stringify(data), {
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(res => {
                resolve(res.data);
            });
    });
}
