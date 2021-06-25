const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const requestIp = require('request-ip');
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/newBlogDB", {useNewUrlParser: true, useUnifiedTopology: true});

const blogSchema = mongoose.Schema({
    title: String,
    tagline: String,
    content: String,
    likes: {
        type: [],
        required: false
    },
    comments: {
        type: [],
        required: false
    }
});


const Blog = mongoose.model('Blog', blogSchema);

app.get('/', (req, res)=>{
    Blog.find((err, result)=>{
        if(!err){
            if(result){
                res.render('index', {allBlogs: result});
            }
        }
    })
});

app.post('/delete', (req, res)=>{
    let blogId = req.body.delete;
    Blog.findByIdAndDelete(blogId, (err)=>{
        if(err){
            console.log('err');
        } else {
            console.log('deleted');
            res.redirect('/')
        }
    })
});

app.get('/blogs/:id', (req, res)=>{
    let id = req.params.id;
    Blog.findById(id, (err, resultBlog)=>{
        if(!err){
            if(resultBlog){
                    let reverserdComments = resultBlog.comments.reverse();
                    res.render('read', {
                    blogTitle: resultBlog.title,
                    blogSub: resultBlog.tagline,
                    blogContent: resultBlog.content,
                    blogID: resultBlog._id,
                    likeCount: resultBlog.likes.length,
                    totalComments: reverserdComments
                });
            }
        }
        if(!resultBlog){
            res.sendFile(__dirname + '/failure.html')
        }
    });
});

app.get('/compose', (req, res)=>{
    res.render('compose')
});

app.post('/compose', (req, res)=>{
    let title = req.body.title;
    let tagline = req.body.tagline;
    let content = req.body.content;

    let newBlog = new Blog({
        title: title,
        tagline: tagline,
        content: content
    });

    newBlog.save()
    res.redirect('/')
});

app.post('/like', (req, res)=>{
    let likedBlogId = req.body.id;

    const clientIp = requestIp.getClientIp(req);

    console.log(clientIp)

    Blog.findOne({_id: likedBlogId, likes: {count: 1, ip: clientIp}}, (err, result)=>{
        if(!err){
            console.log("Found Liked user: "+result)
            if(result){
                console.log('likes not updated')
            } else {
                Blog.findByIdAndUpdate(likedBlogId, {$push: {likes: {count: 1, ip: clientIp}}}, (err)=>{
                    if(!err){
                        console.log('likes updated')
                    }
                });
            }
        }
    });

    res.redirect('/blogs/'+likedBlogId);
});

app.post('/comment', (req, res)=>{
    let commented = req.body.comment;
    let idOfBLog = req.body.submit;

    Blog.findByIdAndUpdate(idOfBLog, {$push: {comments: commented}}, (err)=>{
        if(!err){
            console.log('comment added');
        }
    });
    res.redirect('/blogs/'+idOfBLog);
});

app.get('/return', (req, res)=>{
    res.redirect('/');
});

app.get('*', (req, res)=>{
    res.sendFile(__dirname + '/failure.html');
});

app.get('/like', (req, res)=>{
    res.sendFile(__dirname + '/failure.html');
});

app.get('/comment', (req, res)=>{
    res.sendFile(__dirname + '/failure.html');
});

app.use((req, res, next)=>{
    res.status(404).sendFile(__dirname + '/failure.html')
});

app.listen(3000);
