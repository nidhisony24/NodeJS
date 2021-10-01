exports.seed = async function(db, Promise) {
    // Deletes ALL existing entries

    return db('users').where('username', 'admin')
        .then(function (results) {

            // password = Admin@123
            if (results.length == 0) {
                return db('users').insert([
                    {username: 'admin', email: 'admin@moontowertickets.com', role:'admin', password : '$2a$12$WMbqjK0mzTmfuOhOXCCecOmaQVBA0PA9fBrK5Bjtqf9tSY9PFLGdi', status : 1, name : 'Administrator'},
                ]);
            }
        });
};