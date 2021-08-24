import React, { FunctionComponent } from "react";
import { createStyles, Theme } from "@material-ui/core/styles";
import { makeStyles } from "@material-ui/styles";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import ListItemText from "@material-ui/core/ListItemText";
import Select from "@material-ui/core/Select";
import Checkbox from "@material-ui/core/Checkbox";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flexWrap: "wrap"
    },
    formControl: {
      minWidth: 80,
      width: "90%",
      maxWidth: 120
    },
    chips: {
      display: "flex",
      flexWrap: "wrap"
    },
    chip: {
      margin: 2
    },
    noLabel: {}
  })
);

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250
    }
  }
};


type MultipleSelectProps = {
  list: string[];
  filteredList: string[];
  handleUpdate: (event: React.ChangeEvent<{ value: unknown }>) => void;
  isNumber: boolean;
};

const MultipleSelect: FunctionComponent<MultipleSelectProps> = ({
  list,
  filteredList,
  handleUpdate,
  isNumber
}) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <FormControl className={classes.formControl}>
        <Select
          multiple
          value={filteredList}
          onChange={handleUpdate}
          input={<Input id="select-multiple-checkbox" />}
          renderValue={selected =>
            (selected as string[])
              .map(s => {
                return isNumber ? parseFloat(s).toFixed(1) : s;
              })
              .join(", ")
          }
          MenuProps={MenuProps}
        >
          {list.map(name => (
            <MenuItem key={name} value={name}>
              <Checkbox checked={filteredList.indexOf(name) > -1} />
              <ListItemText
                primary={isNumber ? parseFloat(name).toFixed(1) : name}
              />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default MultipleSelect;
