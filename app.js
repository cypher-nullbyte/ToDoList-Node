
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose=require("mongoose");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect("mongodb://localhost:27017/todoListDB",{useNewUrlParser:true,useUnifiedTopology:true});


const itemsSchema={
  name:String
};

const listSchema={
  name:String,
  items:[itemsSchema]
};

const List=mongoose.model("list",listSchema);
const Item=mongoose.model("Items",itemsSchema);

const defaultItems=[new Item({name:"Welcome to your todoList"}),
new Item({name:"Hit the + button to add a new item."}),
{name:"<--- Check to delete an item."}
];


//#################################
// Get Requests
//#################################
app.get("/", function(req, res) {
  let day = date.getDate();
  Item.find({},(err,foundItems)=>{
  if(foundItems.length===0)
  {
    Item.insertMany(defaultItems,err=>
      {
        if(!err)
          console.log("Successfully inserted Default items!");
      });
    res.redirect("/");
  }
  else
    res.render("list", {listTitle: day, newListItems: foundItems});
  });

});


app.get("/:customListName",(req,res)=>
{
  let listName=(req.params.customListName).toLowerCase();
  List.findOne({name:listName},(err,foundList)=>
  {
    if(!err)
    {
      if(!foundList)
      {
        let list=new List({
          name:listName,
          items:defaultItems
        });
        list.save();
        res.render("list",{listTitle:listName,newListItems:list.items});
      }
      else
        res.render("list",{listTitle:listName,newListItems:foundList.items});
    }
  });
  
});

app.get("/about", function(req, res){
  res.render("about");
});

//#################################
// Post Requests
//#################################
app.post("/", function(req, res){

  let item = new Item({name:req.body.newItem});
  let listName=req.body.list;
  if(req.body.newItem)
  {
    List.findOne({name:listName},(err,foundList)=>
    {
      if(!err)
      {
        if(foundList)
        {
          foundList.items.push(item);
          foundList.save();
          res.redirect("/"+listName);
        }
        else
        {
          item.save();
          res.redirect("/");
        }
      }
    });
  }
});


app.post("/delete",(req,res)=>
{
  let item=req.body.checkbox;
  let listName=req.body.list;
  List.findOne({name:listName},(err,foundList)=>
  {
    if(!err)
    {
      if(foundList)
      {

        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:item},}},{useFindAndModify:false},(error,itemsss)=>
        {
          if(!error)
          {
            console.log(item+ "  deleted!");
            res.redirect("/"+listName);
          }
          else 
          {
            console.log(error);
          }
        });
      }
      else
      {
        Item.findByIdAndDelete(item,error=>
          {
            if(!error)
              console.log(item+ "  deleted!");
            res.redirect("/");
          });
      }
    }
    else
      console.log(err);
  });
});




//######### Server Start
app.listen(3000, function() {
  console.log("Server started on port 3000...");
});