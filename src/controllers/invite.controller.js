const createInvite = async (req, res) => {
    //espero id_group en param /:id_group
    // y email de invited user

    const groupId = req.params.id_group;
    const { invitedUserEmail } = req.body.email?.toLowerCase().trim();



    console.log(groupId);

    return res.status(200).json({ok: true, message : "aca loco"})




    // return res.json({ data: req.user })
};

const acceptInvite = async (req, res) => {
    return res.json({ data: "nothing yet" })
};


export { createInvite, acceptInvite };