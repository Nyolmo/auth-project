const Post = require('../models/postsModel.js');

const { createPostSchema } = require('../middlewares/validator.js');

exports.getPosts = async(req, res)=>{
    console.log("getPosts controller is working!");

    const { page } = req.query;
    const postsPerPage = 10;

    try {
        let pageNum = 0;
        if(page <= 1){
            pageNum = 0;
        }else{
            pageNum = page - 1
        }
        const result = await Post.find()
            .sort({createdAt: -1})
            .skip(pageNum * postsPerPage)
            .limit(postsPerPage)
            .populate({
                path:'userId',
                select: 'email'
            }); 
            
            res.status(200).json({
                success:true,
                message:'posts',
                data: result
            });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Server error!"
        });
    }
};

exports.createPost = async(req, res)=>{
    const { title, description} = req.body;
    const { userId } = req.user;

    try {
        const { error, value } = createPostSchema.validate({ title, description, userId });
        if(error){
            return res.status(401).json({
                success: false,
                message: error.details[0].message
            })
        }
        const newPost = await Post.create({
            title, description, userId
        });
        res.status(201).json({
            success:true,
            message:'Post created successfully!',
            data: newPost
        });


        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Server error!"
        });
    }
 };

 exports.singlePost = async(req, res)=>{
    console.log("singlePost controller is working!");

    const { id } = req.params;
    try {
        const result = await Post.findOne({_id:id})
            .populate({
                path:'userId',
                select: 'email'
            });

            if(!result){
                return res.status(404).json({
                    success: false,
                    message: 'Post not found!'
                });
            }
                        
            res.status(200).json({
                success:true,
                message:'single post',
                data: result
            });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Server error!"
        });
    }
};

