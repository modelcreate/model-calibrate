import React, { FunctionComponent, useEffect } from "react";
import { createStyles, Theme } from "@material-ui/core/styles";
import { makeStyles } from "@material-ui/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TablePagination from "@material-ui/core/TablePagination";
import ModelFeatureCollection from "../../interfaces/ModelFeatureCollection";
import DropDownSelect from "../DropDownSelect";
import { Geometries, Properties, Feature } from "@turf/helpers";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
      padding: 0
    },
    cellFilter: {
      padding: 0
    },
    paper: {
      width: "100%",
      overflowX: "auto"
    },
    table: {
      maxheight: 250,
      overflowX: "auto"
    }
  })
);

const filterFeatures = (
  features: Feature<Geometries, Properties>[],
  materials: string[],
  years: string[],
  diameters: string[]
): Feature<Geometries, Properties>[] => {
  return features.filter(
    feature =>
      feature.geometry &&
      feature.geometry.type === "LineString" &&
      feature.properties &&
      feature.properties.table === "wn_pipe" &&
      ((materials.length !== 0
        ? materials.indexOf(feature.properties.material) > -1
        : true) &&
        (feature.properties && years.length !== 0
          ? years.indexOf(feature.properties.year) > -1
          : true) &&
        (feature.properties && diameters.length !== 0
          ? diameters.indexOf(feature.properties.diameter) > -1
          : true))
  );
};

const getDistictProp = (
  model: ModelFeatureCollection,
  distinctProp: string,
  filter1?: string,
  accepted1?: string[],
  filter2?: string,
  accepted2?: string[]
): string[] => {
  const filteredFeatures = model.features.filter(feature =>
    feature.properties && (accepted1 && filter1 && accepted1.length !== 0)
      ? accepted1.indexOf(feature.properties[filter1]) !== -1
      : true &&
        (feature.properties && accepted2 && filter2 && accepted2.length !== 0)
      ? accepted2.indexOf(feature.properties[filter2]) !== -1
      : true
  );

  return filteredFeatures
    .reduce(
      (prev, curr) => {
        if (
          curr.properties &&
          curr.properties[distinctProp] &&
          prev.indexOf(curr.properties[distinctProp]) === -1
        ) {
          prev.push(curr.properties[distinctProp]);
        }
        return prev;
      },
      [] as string[]
    )
    .sort((a, b) =>
      //@ts-ignore
      a > b ? 1 : b > a ? -1 : 0
    );
};
type TablePipesProps = {
  model: ModelFeatureCollection;
  setFeatures: (features: Feature<Geometries, Properties>[]) => void;
};

const TablePipes: FunctionComponent<TablePipesProps> = ({
  model,
  setFeatures
}) => {
  const classes = useStyles();

  const materials = getDistictProp(model, "material");
  const [filteredMaterials, setFilteredMaterial] = React.useState<string[]>([]);
  const [filteredYears, setFilteredYears] = React.useState<string[]>([]);
  const [filteredDiameters, setFilteredDiameters] = React.useState<string[]>(
    []
  );
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  useEffect(() => {
    const filteredPipes = filterFeatures(
      model.features,
      filteredMaterials,
      filteredYears,
      filteredDiameters
    );

    setFeatures(filteredPipes);
  }, [filteredMaterials, filteredYears, filteredDiameters]);

  const createHandle = (
    func: React.Dispatch<React.SetStateAction<string[]>>
  ) => (event: React.ChangeEvent<{ value: unknown }>): void => {
    func(event.target.value as string[]);
  };

  function handleChangePage(event: unknown, newPage: number) {
    setPage(newPage);
  }

  function handleChangeRowsPerPage(event: React.ChangeEvent<HTMLInputElement>) {
    setRowsPerPage(+event.target.value);
    setPage(0);
  }

  const sortedModel = model.features.sort((a, b) => {
    //@ts-ignore
    if (a.properties.material === b.properties.material) {
      //@ts-ignore
      return a.properties.year - b.properties.year;
    }
    //@ts-ignore
    return a.properties.material > b.properties.material ? 1 : -1;
  });

  const filteredPipes = filterFeatures(
    sortedModel,
    filteredMaterials,
    filteredYears,
    filteredDiameters
  );

  return (
    <div className={classes.root}>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>Id</TableCell>
            <TableCell align="right">Material</TableCell>
            <TableCell align="right">Year</TableCell>
            <TableCell align="right">Diameter</TableCell>
            <TableCell align="right">k</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell />
            <TableCell align="center" className={classes.cellFilter}>
              <DropDownSelect
                list={materials}
                filteredList={filteredMaterials}
                handleUpdate={createHandle(setFilteredMaterial)}
                isNumber={false}
              />
            </TableCell>
            <TableCell align="center" className={classes.cellFilter}>
              <DropDownSelect
                list={getDistictProp(
                  model,
                  "year",
                  "material",
                  filteredMaterials,
                  "diameter",
                  filteredDiameters
                )}
                isNumber={false}
                filteredList={filteredYears}
                handleUpdate={createHandle(setFilteredYears)}
              />
            </TableCell>
            <TableCell align="center" className={classes.cellFilter}>
              <DropDownSelect
                list={getDistictProp(
                  model,
                  "diameter",
                  "material",
                  filteredMaterials,
                  "year",
                  filteredYears
                )}
                isNumber={true}
                filteredList={filteredDiameters}
                handleUpdate={createHandle(setFilteredDiameters)}
              />
            </TableCell>
            <TableCell />
          </TableRow>
          {filteredPipes
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map(row => {
              if (
                row.properties &&
                row.geometry &&
                row.geometry.type === "LineString"
              ) {
                return (
                  <TableRow key={row.properties.id}>
                    <TableCell component="th" scope="row">
                      {row.properties.id}
                    </TableCell>
                    <TableCell align="right">
                      {row.properties.material}
                    </TableCell>
                    <TableCell align="right">{row.properties.year}</TableCell>
                    <TableCell align="right">
                      {row.properties.diameter.toFixed(1)}
                    </TableCell>
                    <TableCell align="right">
                      {row.properties.k.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              }
            })}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredPipes.length}
        rowsPerPage={rowsPerPage}
        page={page}
        backIconButtonProps={{
          "aria-label": "Previous Page"
        }}
        nextIconButtonProps={{
          "aria-label": "Next Page"
        }}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default TablePipes;
