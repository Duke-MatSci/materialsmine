from flask import render_template, request, redirect, Blueprint
import json
from app.models.model import Post, ChemPropsDto
from app.chemprops.nmChemPropsAPI import nmChemPropsAPI 

main = Blueprint("main", __name__)

@main.route("/")
def tests():
    return json.dumps({'hello': "Trigger service"})

@main.route("/chemprops", methods=['GET'])
def chemprops():
    # polfil = ChemPropsDto.query.get_or_404(polfil)
    polfil = request.args.get('polfil', None, type=str)
    ChemicalName = request.args.get('ChemicalName', '', type=str)
    Abbreviation = request.args.get('Abbreviation', '', type=str)
    TradeName = request.args.get('TradeName', '', type=str)
    SMILES = request.args.get('SMILES', '', type=str)
    nmId = request.args.get('nmId', None, type=str)
    if polfil==None or nmId==None:
        return redirect('/404')

@main.route("/index")
@main.route("/i")
def home():
    # I used the below to post bulk data from the data.json file
    # entered = False
    # if entered:
    #     pass
    # else:
    #     tosubmit = []
    #     with open(os.path.join(app.root_path, 'routes/data.json'), "r") as dd:
    #         data = json.load(dd)
    #         for cur in data:
    #             tosubmit.append(Post(title=cur["title"], content=cur["content"], user_id=cur["user_id"]))
    #         db.session.add_all(tosubmit)
    #         db.session.commit()
    #         entered=True

    # posts = Post.query.all()
    # +++++ Paginating instead of using all +++++++
    page = request.args.get('page', 1, type=int) # <= We enter 1 as default and setting parameter to recieve as integer

    # posts = Post.query.paginate(per_page=5, page=page)
    # ++++ Addding Order by +++++
    posts = Post.query.order_by(Post.date_posted.desc()).paginate(per_page=5, page=page)
    return render_template("index.html", posts=posts)

@main.route("/about")
def about():
    return render_template("about.html", title="About Us")
