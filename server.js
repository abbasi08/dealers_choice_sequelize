const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/dc_seq_db"
);

const Food = sequelize.define("food", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
});

const FoodGroup = sequelize.define("group", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
});

Food.belongsTo(FoodGroup);
FoodGroup.hasMany(Food);

const express = require("express");
const server = express();
server.use(express.urlencoded({ extended: false }));

server.get("/", (req, res) => res.redirect("/foods"));

server.post("/foods", async (req, res, next) => {
  try {
    const food = await Food.create(req.body);
    res.redirect(`/groups/${food.groupId}`);
  } catch (error) {
    next(error);
  }
});

server.get("/groups/:id", async (req, res, next) => {
  try {
    const foodGroup = await FoodGroup.findByPk(req.params.id, {
      include: [Food],
    });
    const htmlFoodsByGroup = foodGroup.food
      .map((food) => {
        return `
        <div>
          <ul>
            ${food.name}
          </ul>
      </div>`;
      })
      .join("");
    res.send(
      `<html>
        <head></head>
        <body>
          <h2>Ingredients by Food Group</h2>
          <h3>${foodGroup.name}</h3>
          ${htmlFoodsByGroup}
          <a href='/foods'>Back</a>
        </body>
      </html>`
    );
  } catch (error) {
    next(error);
  }
});

server.get("/foods", async (req, res, next) => {
  try {
    const foods = await Food.findAll({
      include: [FoodGroup],
    });
    const groups = await FoodGroup.findAll();
    const htmlIngdnts = foods
      .map((food) => {
        return `
        <div>
          <ul>
            ${food.name}
            <a href='/groups/${food.groupId}'>(Nutrient Details)</a>
          </ul>
      </div>`;
      })
      .join("");
    res.send(
      `<html>
        <head></head>
        <body>
          <h1>How to Make Chicken Tacos</h1>
          <div>
          <h3>What you'll need:</h3>
          ${htmlIngdnts}
            </div>
          <div>
          <h3> What's YOUR special ingredient?</h3>
          <h4>Add it here:</h4>
          <form method='POST'>
            <input name ='name' placeholder='New ingredient' />
            <select name ='groupId'>
            ${groups
              .map((group) => {
                return `
                <option value ='${group.id}'>${group.name}</option>
                `;
              })
              .join("")}
            </select>
            <button>Add</button>
          </form>
          </div>
        </body>
      </html>`
    );
  } catch (error) {
    next(error);
  }
});

const start = async () => {
  try {
    await sequelize.sync({ force: true });
    const grains = await FoodGroup.create({ name: "Grains" });
    const dairy = await FoodGroup.create({ name: "Dairy" });
    const fruit = await FoodGroup.create({ name: "Fruit" });
    const vegetable = await FoodGroup.create({ name: "Vegetables" });
    const protein = await FoodGroup.create({ name: "Protein" });

    await Food.create({ name: "tortilla", groupId: grains.id });
    await Food.create({ name: "cheese", groupId: dairy.id });
    await Food.create({ name: "lime", groupId: fruit.id });
    await Food.create({ name: "bell peppers", groupId: vegetable.id });
    await Food.create({ name: "onions", groupId: vegetable.id });
    await Food.create({ name: "chicken", groupId: protein.id });

    const port = process.env.PORT || 1338;
    server.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
